const app = require("tns-core-modules/application");
const ManageUsersViewModel = require("../../shared/view-model");

const Observable = require("tns-core-modules/data/observable").Observable;

const DataFormCommitMode = require("nativescript-ui-dataform").DataFormCommitMode;
const DataFormValidationMode = require("nativescript-ui-dataform").DataFormValidationMode;
const DataFormTextEditorType = require("nativescript-ui-dataform").DataFormEditorType.Text;
// const NonEmptyValidator = require("nativescript-ui-dataform").NonEmptyValidator;
// const MinimumLengthValidator = require("nativescript-ui-dataform").MinimumLengthValidator;

const unenrolUser = require("../../shared/functions").unenrolUser;
// const checkErrors = require("../../shared/functions").checkErrors;
const WebServiceModule = require("../../shared/web-service");

var source = new Observable();
var usersToUnenrol = new Observable();
var dataform;
var courseId;
var getUser;

// è più corretto costruire il rad data form da code-behind-file?
function buildRadDataForm(page, gotData) {
    var button = page.getViewById("btn-primary");
    button.visibility = "visible";

    page.bindingContext = new ManageUsersViewModel(gotData.title, "ManageUsers");

    // inizializza i campi del rad data form
    source = {
        user: "",
        role: "Student"
    };
    page.bindingContext.set("source", source);

    if (gotData.title == "Unenrol") {
        // prendi tutti i partecipanti del corso
        let response = WebServiceModule(gotData.ws);

        response.then((data) => {
            var username = localStorage.getItem("utente").username;
            var users = [];
            // inizializza il dataform picker prendendo data[i].fullname, data[i].id dell'utente
            // scorri il json e prendi solo utenti diversi da quello connesso
            for (let i = 0; i < data.length; i++) {
                if (username !== data[i].username) {
                    var item = {
                        key: data[i].id,
                        label: data[i].fullname
                    }
                    users.push(item);
                }
            }
            usersToUnenrol = users;

            page.bindingContext.set("usersToUnenrol", usersToUnenrol);

            // setta la modalità di convalida dei campi del rad data form
            dataform = page.getViewById("myDataForm");
            dataform.commitMode = DataFormCommitMode.Immediate;
            dataform.validationMode = DataFormValidationMode.Immediate;
        });
    }
    else if (gotData.title == "Enrol") {
        getUser = gotData.ws;
        dataform = page.getViewById("myDataForm");
        let userEntityProperty = dataform.getPropertyByName("user");

        // cambia l'editor di immissione dati da Picker a Text
        userEntityProperty.editor.type = DataFormTextEditorType;
        userEntityProperty.hintText = "Digita matricola...";

        // setta i validators - AL MOMENTO NON VENGONO VISUALIZZATI CORRETTAMENTE
        userEntityProperty.required = true;
        // NonEmptyValidator.errorMessage = "Username can't be empty";
        // MinimumLengthValidator.length = 3;
        // MinimumLengthValidator.errorMessage = "Username must be at least 3 characters long";
        // userEntityProperty.validators = [NonEmptyValidator, MinimumLengthValidator];

        // setta la modalità di convalida dei campi
        dataform.commitMode = DataFormCommitMode.Immediate;
        dataform.validationMode = DataFormValidationMode.Immediate;
    }
}

function onNavigatingTo(args) {
    const page = args.object;

    if (page.navigationContext) {
        var gotData = page.navigationContext;
        
        // setta l'id del corso, valore che sarà utile per effettuare azioni sull'utente selezionato
        courseId = gotData.id;

        if (gotData.title == "Enrol" || gotData.title == "Unenrol") {
            buildRadDataForm(page, gotData);
        }       
    }
    else {
        console.log("navigationContext undefined");
    }
}

function onTap(args) {
    const page = args.object.page;
    const myDataForm = page.getViewById("myDataForm");
    var action = args.object.text;

    // se hai scelto Enrol
    if (action === "Enrol") {
        let username = myDataForm.getPropertyByName("user").value.toString();
        console.log("user: " + username);
        if (username.length == 0) {  // provvisorio, da rimpiazzare con checkErrors(myDataForm); che al momento da errore
            alert("Username can't be empty");
            return;
        }
        // verifica se l'username inserito è corretto
        getUser += username;
        //console.log(getUser);
        let response = WebServiceModule(getUser);
        response.then((data) => {
            // se l'username non è valido, notificalo all'utente
            if (data['users'].length == 0) {
                alert("Errore: utente già iscritto o username non valido");
                return;
            }

            // se si fa l'enrol di qualcuno già iscritto la web service restituisce sempre "null" come in caso di successo
            // Procedere all'enrol
            let id = data['users'][0].id;
            let enrolUser = "enrol_manual_enrol_users&enrolments[0][roleid]=5&enrolments[0][userid]=" + id + "&enrolments[0][courseid]=" + courseId;
            let response = WebServiceModule(enrolUser);
            response.then((data) => {
                if (data.exception) {
                    // handle errors
                    console.log("Errore: ");
                    console.log(data.exception);
                    console.log(data.errorcode);
                    console.log(data.message);
                    alert("Operazione non riuscita");
                }
            });
            alert("L'utente è stato iscritto");
        });
    }
    else if (action === "Unenrol") {
        // se hai scelto Unenrol esegui le seguenti operazioni
        // prendi l'id dell'utente da disiscrivere
        var userid = myDataForm.getPropertyByName("user").value.toString();

        // console.log("hai scelto di disiscrivere l'utente " + userid);
        unenrolUser(page, userid, courseId);
        alert("L'utente è stato rimosso dal corso");
    }
}

function onPropertyCommitted(args) {
    // console.log("Property has been committed...");
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onPropertyCommitted = onPropertyCommitted;
exports.onTap = onTap;
exports.onDrawerButtonTap = onDrawerButtonTap;