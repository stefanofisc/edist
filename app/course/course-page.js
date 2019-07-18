const app = require("tns-core-modules/application");
const CourseViewModel = require("../shared/view-model");
const WebServiceModule = require("../shared/web-service");
// const stripHtmlTags = require("../shared/functions").stripHtmlTags;
const unenrolUser = require("../shared/functions").unenrolUser;
const setNavigationParams = require("../shared/functions").setNavigationParams;
const action = require("tns-core-modules/ui/dialogs").action;
const utilsModule = require("tns-core-modules/utils/utils");
const listViewModule = require("tns-core-modules/ui/list-view");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const HtmlView = require("tns-core-modules/ui/html-view").HtmlView;

var courseContent = [];
var courseId;

function initLabel(filename, isHtml = false) {
    var label;
    if (isHtml) {
        label = {
            id: "htmlsection",
            htmltext: filename,
            // iconURL: "~/app-root/resources/icons/render.png",    
            width: 0,
            height: 0,
            noarrow: "~/app-root/resources/icons/render.png",
            htmlvisibility: "visible",
            // notvisible: "hidden"
        };
    }
    else {
        if (filename.length == 0) {
            id = "separator";
        }
        label = {
            id: "section-title",
            filename: filename,
            // iconURL: "~/app-root/resources/icons/render.png",   
            width: 0,
            height: 0,
            noarrow: "~/app-root/resources/icons/render.png",
            normalLabelVisibility: "visible",
            // notvisible: "hidden"
        };
    }
    return label;
}

function buildLayout(page, data, title, courseid) {
    const topicNum = data.length;

    courseContent = [];
    for (let i = 0; i < topicNum; i++) {                                                // scorri elementi ricevuti e costruisci il layout di pagina
        courseContent.push(initLabel(data[i].name));

        var moduleLength = data[i]['modules'].length;
        if (moduleLength > 0) {                                                         // stampa contenuti sezione
            for (let x = 0; x < moduleLength; x++) {
                var modname = data[i]['modules'][x].modname;
                if (modname === "folder") {                                             // mostra cartella e contenuti
                    // courseContent.push(initLabel(data[i]['modules'][x].name));       // mostra nome cartella come etichetta

                    let contentsLength = data[i]['modules'][x]['contents'].length;      // crea bottoni per elementi cartella
                    let foldername = data[i]['modules'][x].name;
                    buildResourceObject(contentsLength, data[i]['modules'][x]['contents'], null, foldername);

                    // courseContent.push(initLabel(""));                               // separatore tra contenuto cartella e altri contenuti del topic non della cartella
                }
                else if (modname === "page" || modname === "book") {
                    // salva data[i]['modules'][x]['contents'] e passalo ad item, li mostri tutto il contenuto
                    buildPage(modname, data[i]['modules'][x].name, data[i]['modules'][x].url, data[i]['modules'][x]['contents']);
                }
                else if (modname === "label") {                       // mostra label / descrizione (non è una risorsa con contenuti come i file)
                    const myText = new HtmlView();
                    myText.html = data[i]['modules'][x].description;
                    courseContent.push(initLabel(myText.html, true));
                }
                else if (modname === "resource") {
                    buildResourceObject(1, data[i]['modules'][x]['contents']);
                }
                else if (modname === "url") {
                    let filename = data[i]['modules'][x].name;
                    let fileurl = data[i]['modules'][x]['contents'][0].fileurl;
                    buildURL(filename, fileurl);
                }
                else if (modname === "forum") {
                    buildResourceObject(0, data[i]['modules'][x], courseid);
                }
                else if (modname == "scorm") {
                    buildSCORM(data[i]['modules'][x], courseid);
                }
                else {
                    console.error("Tipologia di risorsa non riconosciuta");
                    var navigationParams = {
                        moduleName: "shared/error/error-page",
                        context: {
                            errorMessage: "Tipologia di risorsa non riconosciuta - modname = " + modname
                        }
                    }
                    page.frame.navigate(navigationParams);
                }
            }
        }
    }
    // Una volta costruito l'array courseContent inizializziamo la pagina
    var myObservableArray = new ObservableArray(courseContent);
    page.bindingContext = new CourseViewModel(title, "Course", myObservableArray);
    // page.bindingContext.set("dataItems", myObservableArray);
    // console.timeEnd('course');
}

function setIcon(mimetype) {
    var icon;
    if (mimetype.includes("pdf")) {
        icon = "http://192.167.9.181/server/icons/pdf.png";
    } else if (mimetype.includes("msword")) {
        icon = "http://192.167.9.181/server/icons/book.png";
    } else if (mimetype.includes("vnd.ms-powerpoint")) {
        icon = "http://192.167.9.181/server/icons/book.png"
    } else if (mimetype == "text/plain") {
        icon = "http://192.167.9.181/server/icons/book.png";
    } else if (mimetype.includes("video")) {
        icon = "http://192.167.9.181/server/icons/play.png";
    } else if (mimetype.includes("image")) {
        icon = "http://192.167.9.181/server/icons/image.png";
    } else if (mimetype.includes("zip") || mimetype.includes("archive") || mimetype == "scorm" || mimetype == "application/x-rar-compressed") {
        icon = "http://192.167.9.181/server/icons/archive.png";
    } else {
        icon = "http://192.167.9.181/server/icons/book.png";
    }
    return icon;
}

// Si tratta di una RESOURCE (text/plain, application/pdf, video/mp4, image/png, ...) oppure di un FORUM.
// RESOURCE
// Prendi nome del file (titolo), tipologia (mimetype), e url della risorsa.
// FORUM
// Prendi nome del forum (titolo), tipologia (modname) e id del corso tramite il quale possiamo ricavare l'id del forum
// Costruisci bottone e al click naviga verso la pagina item.
// Una volta in item, in base a gotData.filetype si stabilirà come visualizzare la risorsa.

function buildResourceObject(contentsLength, dataContents, courseid = -1, foldername = "") {
    var id = "section-content";
    var isVisible = "visible";
    if (contentsLength > 0) {
        var icon;
        var moduleName = "course/item/item-page";
        var token = "&token=" + localStorage.getItem("utente").token;
        for (let i = 0; i < contentsLength; i++) {
            icon = setIcon(dataContents[i].mimetype);
            var item;
            if (i == 0 && foldername.length > 0) {
                item = {
                    id: id,
                    moduleName: moduleName,
                    filename: dataContents[i].filename,
                    filetype: dataContents[i].mimetype,
                    fileurl: dataContents[i].fileurl + token,
                    iconURL: icon,
                    normalLabelVisibility: isVisible,
                    foldername: foldername,
                    h: "auto"
                }
            }
            else {
                item = {
                    id: id,
                    moduleName: moduleName,
                    filename: dataContents[i].filename,
                    filetype: dataContents[i].mimetype,
                    fileurl: dataContents[i].fileurl + token,
                    iconURL: icon,
                    normalLabelVisibility: isVisible,
                }
            }
            courseContent.push(item);
        }
    }
    else {  // si tratta di altro (forum,...)
        // console.log("entro nell'else");
        let item = {
            id: id,
            moduleName: "course/forum/forum-page",    // course/item/item-page
            filename: dataContents.name,
            filetype: dataContents.modname,
            courseid: courseid,
            iconURL: "http://192.167.9.181/server/icons/forum.png",
            normalLabelVisibility: isVisible
        }
        courseContent.push(item);
    }
}

function buildURL(filename, fileurl) {
    let item = {
        id: "section-content",
        filename: filename,
        fileurl: fileurl,
        filetype: "url",
        iconURL: "http://192.167.9.181/server/icons/url.png",
        normalLabelVisibility: "visible"
    };
    courseContent.push(item)
}

function buildPage(filetype, pageName, pageURL, pageContent) {
    let item = {
        id: "section-content",
        moduleName: "course/item/item-page",
        filename: pageName,
        filetype: filetype, // page / book
        fileurl: pageURL,
        pageContent: pageContent,
        iconURL: "http://192.167.9.181/server/icons/filepage.png",
        normalLabelVisibility: "visible"
    }
    courseContent.push(item);
}

function buildSCORM(scormdata, courseid) {  // web view?
    var icon = setIcon(scormdata.modname);
    let item = {
        id: "section-content",
        moduleName: "course/item/item-page",
        filename: scormdata.name,
        filetype: scormdata.modname,
        fileurl: scormdata.url,
        courseid: courseid,
        iconURL: icon,
        normalLabelVisibility: "visible",
    };
    courseContent.push(item);
}

function onSelectedItem(page, listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        const tappedItemIndex = args.index;
        if (courseContent[tappedItemIndex].id == "section-content") {   // risorsa
            if (courseContent[tappedItemIndex].filetype != "url") {
                // costruisci navigationParams per page, risorse e forum
                let navigationParams = {
                    moduleName: courseContent[tappedItemIndex].moduleName,
                    context: courseContent[tappedItemIndex]
                }
                page.frame.navigate(navigationParams);
            }
            else if (courseContent[tappedItemIndex].filetype == "url") {
                utilsModule.openUrl(courseContent[tappedItemIndex].fileurl);
            }
        }
    });
    return listView;
}

function onNavigatingTo(args) {
    const page = args.object;
    const listView = page.getViewById("list-group");

    if (listView.items) {   // evita che durante la backward navigation venga duplicato il layout di pagina
        return;
    }

    if (page.navigationContext) {
        // console.time('course');
        gotData = page.navigationContext;                           // prendi web service e nome del corso
        var myFunction = gotData.ws;
        var title = gotData.title;
        // var id = gotData.id; // se la riga di codice di sotto dovesse dare problemi con gli id dei corsi, torna a questa predefinita funzionante
        courseId = gotData.id;
        var response = WebServiceModule(myFunction);                // effettua richiesta tramite web service per mostrare il contenuto del corso
        response.then(function (data) {
            buildLayout(page, data, title, courseId);               // ritorna a passare id se dovessi avere dei problemi
            listView = onSelectedItem(page, listView);
        });
    }
    else {
        console.error("Errore: corso non disponibile");
    }
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function mySettings(args) {
    const page = args.object.page;
    var token = localStorage.getItem("utente").token;

    if (token != undefined) {   // verifica con il token dell'utente, se si tratta di un editing teacher di quel corso

        var isFavourite = "Aggiungi ai preferiti";
        var getStarredCourses = "block_starredcourses_get_starred_courses&limit=0&offset=0";
        var isStarred = WebServiceModule(getStarredCourses, token);
        isStarred.then((data) => {
            if (data) {
                // verifica tramite id matching se il corso è tra i preferiti dell'utente
                for (let i = 0; i < data.length; i++) {
                    if (data[i].id == courseId) {
                        // corso tra i preferiti, devi mostrare "Rimuovi dai preferiti"
                        isFavourite = "Rimuovi dai preferiti";
                        break;
                    }
                }
            }
            else {
                // l'utente non ha corsi preferiti
            }

            var isEditingTeacher = "core_course_get_user_administration_options&courseids[0]=" + courseId;
            var response = WebServiceModule(isEditingTeacher, token);
            response.then((data) => {
                var actionOptions;

                if (data['courses'][0]['options'][0].available == true) { // l'utente connesso è il prof di quel corso, ha i permessi
                    actionOptions = {
                        title: "Impostazioni",
                        actions: ["Partecipanti", isFavourite, "Enrol users", "Unenrol users", "Disiscrivimi dal corso"] // aggiungi ulteriori comandi se l'utente connesso è il prof del corso
                    };
                }
                else {
                    actionOptions = {
                        title: "Impostazioni",
                        actions: ["Partecipanti", isFavourite, "Disiscrivimi dal corso"] // semplice utente
                    };
                }
                action(actionOptions).then((result) => {
                    if (result === "Disiscrivimi dal corso") {
                        // Effettua web service ed esci dal corso tornando alla pagina precedente

                        let userid = localStorage.getItem("utente").id;
                        unenrolUser(page, userid, courseId);
                        page.frame.goBack();
                    }
                    else if (result.includes("preferiti")) {
                        var favourite = 0;
                        if (result === "Aggiungi ai preferiti") {
                            favourite = 1;
                        }
                        let setStarredCourse = "core_course_set_favourite_courses&courses[0][id]=" + courseId + "&courses[0][favourite]=" + favourite;
                        let r = WebServiceModule(setStarredCourse, token);
                        r.then((data) => {
                            if (data.errorcode) {
                                console.error(data);
                            }
                            else if (data['warnings'][0].warningcode) {
                                console.log(data['warnings'][0]);
                                alert(data['warnings'][0].message);
                            }
                            else {
                                // corso aggiunto/rimosso ai/dai preferiti
                            }
                        });
                    }
                    else {
                        var moduleName = "course/manageusers/manageusers-page";
                        var ws, navigationParams, title;
                        if (result === "Partecipanti") {
                            ws = "core_enrol_get_enrolled_users&courseid=" + courseId;
                            title = "Partecipanti";
                            moduleName = "browse/browse-page";
                        } else if (result === "Enrol users") {
                            ws = "core_user_get_users&criteria[0][key]=username&criteria[0][value]=";
                            title = "Enrol";
                        } else if (result === "Unenrol users") {
                            ws = "core_enrol_get_enrolled_users&courseid=" + courseId;
                            title = "Unenrol";
                        }
                        else {
                            console.log("errore");
                            return;
                        }
                        navigationParams = setNavigationParams(moduleName, ws, title, courseId);
                        page.frame.navigate(navigationParams);
                    }
                });
            });
        });
    }
}


exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.mySettings = mySettings;
exports.setIcon = setIcon;