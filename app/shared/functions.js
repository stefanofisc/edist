// In questo modulo inseriamo tutte le function comuni che possono essere richiamate da altri moduli
const Label = require("tns-core-modules/ui/label").Label;
const Button = require("tns-core-modules/ui/button").Button;
const httpModule = require("tns-core-modules/http");
const confirm = require("tns-core-modules/ui/dialogs").confirm;
const WebServiceModule = require("./web-service");
const listViewModule = require("tns-core-modules/ui/list-view");
const frameModule = require("tns-core-modules/ui/frame");
var gestures = require("tns-core-modules/ui/gestures");


module.exports = {
    // Inserisci qui le functions che alcuni moduli hanno in comune

    /* La function stripHtmlTags prende in input un testo formattato con tag html/xml e restituisce in output la stringa "pulita". */
    stripHtmlTags: function (htmlText) {

        if (htmlText === "") {   // stringa vuota
            console.log("Error, html text required");
            return;
        }

        // utilizza espressioni regolari per "pulire" la stringa dai tag
        htmlText = htmlText.replace(/<[^>]+>/g, '');
        htmlText = htmlText.replace(/&nbsp;/gi, " ");
        htmlText = htmlText.replace(/&amp;/gi, "&");
        htmlText = htmlText.replace(/&quot;/gi, '"');
        htmlText = htmlText.replace(/&lt;/gi, '<');
        htmlText = htmlText.replace(/&gt;/gi, '>');

        return htmlText;
    },

    initLabel: function (container, info, id, textAlignment = "left", textWrap = true, fontSize = 14, padding = 0) {
        var myLabel = new Label();

        if (id == "forum-announcements") {
            const page = container.page;
            myLabel.text = info.filename;
            var navigationParams = {
                moduleName: info.moduleName,
                context: info
            };
            myLabel.on(gestures.GestureTypes.tap, () => {
                page.frame.navigate(navigationParams);
            });
        }
        else {
            myLabel.text = info;    // in questo caso info è un testo
        }
        myLabel.id = id;
        myLabel.textAlignment = textAlignment;
        myLabel.textWrap = textWrap;

        if (fontSize) {
            myLabel.fontSize = fontSize;
        }
        if (padding) {
            myLabel.padding = padding;
        }

        container.addChild(myLabel);
    },

    setNavigationParams: function (modName, ws, title = "Title", id = 0) {
        var navigationParams = {
            moduleName: modName,
            context: {
                ws: ws,
                id: id,
                title: title
            }
        }
        return navigationParams;
    },
    buildJSONitem: function (data, searchOnly = false, teacher = "") {
        var items;
        if (!searchOnly) {
            items = {
                item: data.displayname,
                id: data.id,
                shortname: data.shortname,
                summary: module.exports.stripHtmlTags(data.summary),
                isStarredCourse: data.isfavourite
            }
        }
        else {
            items = {
                item: data.displayname,
                id: data.id,
                shortname: data.shortname,
                summary: module.exports.stripHtmlTags(data.summary),
                info: data.categoryname + " - prof. " + teacher
            }
        }
        return items;
    },
    // RadDataForm
    checkErrors: function (myDataForm) {  // verifica se ci sono errori di compilazione dei campi
        const hasErrors = myDataForm.hasValidationErrors();

        if (hasErrors) {
            console.log("Validation error: " + hasErrors.toString());
            return true;
        }
        else {
            return false;
        }
    },

    // Corso
    isAlreadyEnrolled: function (data, courseid) {
        var userCourses = [];
        for (let i = 0; i < data.length; i++) {
            userCourses.push(data[i].id);
        }
        var isEnrolled = false;
        for (let i = 0; i < userCourses.length; i++) {
            if (userCourses[i] == courseid) {
                isEnrolled = true;
                break;
            }
        }
        return isEnrolled;
    },

    hasSelfEnrolment: function (data) { // verifica se il corso permette agli utenti di autoiscriversi
        if (data.length == 0) {
            console.log("no self enrolment");
            return false;
        }
        var selfEnrolment = false;
        for (let i = 0; i < data.length; i++) {
            if (data[i].type == "self") {
                selfEnrolment = true;
                break;
            }
        }
        return selfEnrolment;
    },
    // Quando l'utente tenta di accedere al corso, valuta se è già iscritto, se può iscriversi o se non può proprio accedere a quel corso
    manageCourseAccess: function (page, category) {
        var modName = 'course/course-page';
        var ws = "core_course_get_contents&courseid=" + category.id;

        // Verifica se l'utente può accedere direttamente al corso
        var userid = localStorage.getItem('utente').id;
        let webservice = "core_enrol_get_users_courses&userid=" + userid;

        let resp = WebServiceModule(webservice);
        resp.then((data) => {

            if (module.exports.isAlreadyEnrolled(data, category.id)) {
                // Utente iscritto al corso, procedo con l'accesso

                let navigationParams = module.exports.setNavigationParams(modName, ws, category.item, category.id);
                page.frame.navigate(navigationParams);
            }
            else {
                // Se il corso ha abilitato il self enrolment, proponi all'utente la possibilità di iscriversi, 
                // altrimenti l'utente non può accedere al contenuto di quel corso,
                // resta quindi nella pagina attuale dei corsi.

                let webservice = "core_enrol_get_course_enrolment_methods&courseid=" + category.id;
                let resp = WebServiceModule(webservice);
                resp.then((data) => {
                    if (module.exports.hasSelfEnrolment(data)) {

                        // Costruisci la finestra di dialogo per far iscrivere l'utente al corso

                        const confirmOptions = {
                            title: "Vuoi iscriverti al corso?",
                            message: "Per accedere hai bisogno di iscriverti",
                            okButtonText: "Iscrivimi al corso",
                            cancelButtonText: "Annulla"
                        };
                        confirm(confirmOptions).then((result) => {
                            // result : boolean
                            // Se result è true iscrivi l'utente al corso. 
                            // A prescindere che sia un prof o uno studente, questo si iscrive da normale utente al corso senza particolari privilegi, 
                            // i quali gli devono essere assegnati dall'amministratore del sistema.
                            // Se result è false non devi accedere al corso

                            if (result == true) {

                                // Iscrivo utente al corso in qualità di studente (roleid = 5). Sarà poi l'admin ad assegnare eventuali ruoli di editing teacher

                                let webservice = "enrol_manual_enrol_users&enrolments[0][roleid]=5&enrolments[0][userid]=" + userid + "&enrolments[0][courseid]=" + category.id;
                                let resp = WebServiceModule(webservice);
                                resp.then((data) => {
                                    // La web service in caso di successo non restituisce niente (pagina vuota). 
                                    // Quindi qui ci entra solo in caso di errore, perchè solo in quel caso la web service restituirà qualcosa.

                                    if (data.exception || data.errorcode) {
                                        console.error(data.message);
                                        module.exports.displayError(page, "Iscrizione non riuscita, ti invitiamo a riprovare più tardi");
                                    }
                                });
                                // Se non ci sono stati errori durante l'enrol, accedi alla pagina del corso

                                let navigationParams = module.exports.setNavigationParams(modName, ws, category.item, category.id);
                                page.frame.navigate(navigationParams);
                            }
                            else {
                                // console.log("L'utente ha rifiutato di iscriversi");  Resta nell'attuale pagina
                            }
                        });
                    }
                    else {

                        // Non deve andare nella pagina del corso perchè non ha i permessi necessari
                        // Reindirizza l'utente verso la pagina di errore e mostragli cosa è andato storto: "Non puoi visualizzare questo contenuto"
                        module.exports.displayError(page, "Non puoi visualizzare questo contenuto");
                    }
                });
            }
        });
    },
    // Disiscrivi utente da un corso
    unenrolUser: function (page, userid, courseid) {
        let myFunction = "enrol_manual_unenrol_users&enrolments[0][userid]=" + userid + "&enrolments[0][courseid]=" + courseid + "&enrolments[0][roleid]=5";
        let response = WebServiceModule(myFunction);
        response.then((data) => {
            if (data.exception || data.errorcode) {
                console.error(data.message);
                let errorParams = {
                    moduleName: "shared/error/error-page",
                    context: {
                        errorMessage: "Operazione non riuscita, riprova più tardi!"
                    }
                };
                page.frame.navigate(errorParams);
            }
        });
    },
    // Verifica se il corso ha insegnanti
    // La function verifica se al corso sono associati degli insegnanti. È stato necessario implementarla perchè ho riscontrato questo problema:
    // Mostrando in {{ info }} il nome dell'insegnante, quando ho creato un nuovo corso BD1 al quale non era assegnato nessun prof e
    // volevo mostrare la lista dei corsi di Informatica sull'app, non me la caricava perchè andava in errore in mancanza di "data['courses'][i]['contacts'][0].fullname"
    // La seguente function risolve questo problema
    courseTeacher: function (contacts) {
        if (contacts.length == 0) {
            return false;
        }
        return true;
    },
    // Files
    displayFileContent: function (fileurl) {
        var response = httpModule.getFile(fileurl).then(function (r) {
            // handle response 
            console.log("mostro il file");
            console.log("file content: " + r.readTextSync().toString());
            return r;
        }, function (e) {
            // handle errors
            console.log(e);
            return e;
        }
        );
        // restituisci un oggetto Promise
        return response;
    },

    // ListView
    onListViewLoaded: function (listView, items) {
        listView.on(listViewModule.ListView.itemLoadingEvent, (args) => {
            if (!args.view) {
                // Crea label se non è stato già creato
                args.view = new Label();
                args.view.className = "list-group-item";
            }
            (args.view).text = items[args.index].item;
        });
    },


    // initButton
    initButton: function (page, dataObject, id, container, backstackVisible = true, col = null) {
        var myButton = new Button();

        myButton.text = dataObject.filename;
        myButton.id = id;
        myButton.textWrap = true;
        if (col != null) {
            myButton.col = col;
        }

        var navigationParams = {        // crea oggetto con parametri di navigazione e passalo al metodo navigate
            moduleName: dataObject.moduleName,
            context: dataObject,
            backstackVisible: backstackVisible
        }

        function onTap() {                  // gestire diverse azioni per diverse tipologie di file (testo, pdf, ...)
            // alert("item type: " + dataObject.filetype);
            page.frame.navigate(navigationParams);
        }

        myButton.on(Button.tapEvent, onTap, this);

        container.addChild(myButton);
    },

    // displayError
    displayError: function (page, errorMessage) {
        var errorParams = {
            moduleName: "shared/error/error-page",
            context: {
                errorMessage: errorMessage
            }
        }
        page.frame.navigate(errorParams);
    },

    // timestamp converter
    timestampconvert: function(time) {
        const date = new Date(time * 1000);
        return date.toUTCString().replace("GMT","");
    },

    // logout 
    onLogout: function() {
        const confirmOptions = {
            title: "Logout",
            message: "Vuoi uscire?",
            okButtonText: "Esci",
            cancelButtonText: "Annulla"
        };
        confirm(confirmOptions).then((result) => {
            if (result == true) {
                localStorage.clear();
                frameModule.topmost().navigate({
                    moduleName: "login/login-page",
                    transition: {
                        name: "fade"
                    },
                    clearHistory: true
                });
            }
        });
    }
}