const app = require("tns-core-modules/application");
const AddPostViewModel = require("../../../shared/view-model");
const Observable = require("tns-core-modules/data/observable").Observable;
const DataFormCommitMode = require("nativescript-ui-dataform").DataFormCommitMode;
const DataFormValidationMode = require("nativescript-ui-dataform").DataFormValidationMode;
const checkErrors = require("../../../shared/functions").checkErrors;
const displayError = require("../../../shared/functions").displayError;
const WebServiceModule = require("../../../shared/web-service");
String.prototype.escapeSpecialChars = function () {     // verificare il carattere di escape \n perchè se vai a capo la web service non lo prende
    return this.replace(/ /g, "%20")
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
};
var dataform = new Observable();
var token;

function onNavigatingTo(args) {
    const page = args.object;

    if (page.navigationContext) {
        var gotData = page.navigationContext;
        page.bindingContext = new AddPostViewModel(gotData.title, "AddPost");

        // costruisci form per aggiungere commento
        dataform = {
            title: "",
            message: ""
        }
        page.bindingContext.set("dataform", dataform);
        // setta la convalida dei campi
        dataform = page.getViewById("myDataForm");
        dataform.commitMode = DataFormCommitMode.Immediate;
        dataform.validationMode = DataFormValidationMode.Immediate;
    }
    else {
        console.log("navigationContext undefined");
    }
}

function onPropertyCommitted(args) {
    // rendi visibile/abilita il bottone quando l'utente immette dati
    const page = args.object.page;
    const button = page.getViewById("btn-primary");
    if (button.isEnabled != true) {
        button.isEnabled = true;
    }
}

function onTap(args) {
    const page = args.object.page;
    const myDataForm = page.getViewById("myDataForm");

    if (checkErrors(myDataForm)) {
        return;
    }
    // se non ci sono stati errori, prendi dati dal form
    var subject = myDataForm.getPropertyByName("title").value.toString().escapeSpecialChars();
    var message = myDataForm.getPropertyByName("message").value.toString().escapeSpecialChars();

    // costruisco web service
    var gotData = page.navigationContext;
    var add = gotData.ws + "&subject=" + subject + "&message=" + message;
    
    // prendi il token con il quale effettuare la web service
    token = gotData.token;

    // effettua la richiesta ed aggiungi discussione / risposta al post
    var response = WebServiceModule(add, token);
    response.then((data) => {
        if (data.errorcode) {
            displayError(page, data.message);
        }
        else {
            // ritorna alla pagina dei post del forum
            console.log("post inserito con successo");
            page.frame.goBack();
        }
    });
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onPropertyCommitted = onPropertyCommitted;
exports.onTap = onTap;
exports.onDrawerButtonTap = onDrawerButtonTap;