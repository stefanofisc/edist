const app = require("tns-core-modules/application");
// const MyProfileViewModel = require("./myprofile-view-model");
const ViewModel = require("../../shared/view-model");
const WebServiceModule = require("../../shared/web-service");
const StripHtmlTags = require("../../shared/functions").stripHtmlTags;
const checkErrors = require("../../shared/functions").checkErrors;
const Observable = require("tns-core-modules/data/observable").Observable;
const DataFormCommitMode = require("nativescript-ui-dataform");
//const personMetadata = require("./person-metadata.json"); // non utilizzato se la pagina xml è costruita in modo statico

var person = new Observable();
var countryNames = new Observable();
var pageData = new Observable();
var dataform;
var user;

// tutti i campi che al massimo possono essere mostrati sullo schermo, DA AGGIORNARE
var dataFormFields = [
    "name", "username", "email", "phone1", "phone2", "department", "description", "city", "country",
    "address", "icq", "skype", "yahoo", "aim", "msn", "institution", "url"
];

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

function buildLayout(page, pageData, data, myUser) {
    // console.time('profile2');
    pageData = new ViewModel("Profilo", "MyProfile");
    page.bindingContext = pageData;

    var username = page.getViewById("username");
    dataform = page.getViewById("myDataForm");
    var button = page.getViewById("settings-button");

    // verifica se la pagina la sta visitando l'utente "proprietario" o uno generico
    // in questo modo abiliti o meno le modifiche
    var connectedUser = localStorage.getItem("utente").username;
    
    if (myUser != connectedUser) {
        button.isEnabled = false;
        button.visibility = "hidden";
    }
    else {
        button.isEnabled = true;
    }

    // setta l'header della pagina, mostrando il nome dell'utente
    username.text = data['users'][0].fullname;
    username.textAlignment = "center";
    username.fontSize = 20;

    // inizializza l'oggetto person del rad data form
    person = {  // potresti non visualizzare tutti questi campi sullo schermo perchè, l'utente potrebbe scegliere dal sito di non farli visualizzare
        name: "",
        username: "",
        email: "",
        phone1: "",
        phone2: "",
        department: "",
        description: "",
        city: "",
        country: "",
        address: "",
        icq: "",
        skype: "",
        yahoo: "",
        aim: "",
        msn: "",
        institution: "",
        url: "",
        courses: ""
    };

    // TO-DO: prendi i corsi dell'utente e mostrali
    // ...
    setPerson(person, data);
    countryNames = [
        { key: "EN", label: "England" },
        { key: "FR", label: "France" },
        { key: "GER", label: "Germany" },
        { key: "IT", label: "Italy" },
        { key: "SW", label: "Switzerland" },
        { key: "US", label: "United States" }
    ];

    pageData.set("profileimage", data['users'][0].profileimageurl);
    pageData.set("person", person);
    //pageData.set("personMetadata", JSON.parse(JSON.stringify(personMetadata)));
    pageData.set("countryNames", countryNames);
    // console.timeEnd('profile2');
    // setta la modalità di convalida dei campi
    dataform.commitMode = DataFormCommitMode.Immediate;
    // console.timeEnd('profile2');
    dataform.validationMode = DataFormValidationMode.Immediate;
    // stile dei gruppi
    // const group = dataform.getGroupByName("Main Info");
    // group.titleStyle.labelTextColor = new Color("Blue");
}

function setPerson(person, data) {
    // verifica se i campi restituiti dalla web service sono nulli o meno, in tal caso assegna ""
    if (data['users'][0].fullname) {
        person.name = data['users'][0].fullname;
    }
    if (data['users'][0].username) {
        person.username = data['users'][0].username;
    }
    if (data['users'][0].email) {
        person.email = data['users'][0].email;
    }
    if (data['users'][0].phone1) {
        person.phone1 = data['users'][0].phone1;
    }
    if (data['users'][0].phone2) {
        person.phone2 = data['users'][0].phone2;
    }
    if (data['users'][0].icq) {
        person.icq = data['users'][0].icq;
    }
    if (data['users'][0].skype) {
        person.skype = data['users'][0].skype;
    }
    if (data['users'][0].yahoo) {
        person.yahoo = data['users'][0].yahoo;
    }
    if (data['users'][0].aim) {
        person.aim = data['users'][0].aim;
    }
    if (data['users'][0].msn) {
        person.msn = data['users'][0].msn;
    }
    if (data['users'][0].department) {
        person.department = data['users'][0].department;
    }
    if (data['users'][0].institution) {
        person.institution = data['users'][0].institution;
    }
    if (data['users'][0].description) {
        person.description = StripHtmlTags(data['users'][0].description);
    }
    if (data['users'][0].city) {
        person.city = data['users'][0].city;
    }
    if (data['users'][0].country) {
        person.country = data['users'][0].country;
    }
    if (data['users'][0].url) {
        person.url = data['users'][0].url;
    }
    if (data['users'][0].address) {
        person.address = data['users'][0].address;
    }
}

function onEdit(args) {
    const button = args.object;
    const page = button.page;
    var myDataForm = page.getViewById("myDataForm");
    var saveButton = page.getViewById("profile-button-save");

    myDataForm.isReadOnly = false;
    saveButton.visibility = "visible";
}
// Questo è il bottone di Salva modifiche che viene abilitato solo dopo che l'utente clicca sul tasto edit
function onTap(args) {
    var saveButton = args.object;
    const page = saveButton.page;
    var myDataForm = page.getViewById("myDataForm");

    //myDataForm.validateAndCommitAll(); // effettua il commit dei risultati - non serve se il commit e validate sono immediate

    if (checkErrors(myDataForm)) {
        return;
    }

    myDataForm.isReadOnly = true;
    saveButton.visibility = "hidden";

    var myParameters = "core_user_update_users&users[0][id]=" + localStorage.getItem("utente").id;

    for (let i = 0; i < dataFormFields.length; i++) {
        let property = myDataForm.getPropertyByName(dataFormFields[i]);

        if (property) {                             // se il campo è visibile sullo schermo prendi il suo valore, potrebbe essere eliminato come controllo, ma è comunque un ulteriore step di sicurezza

            if (!property.readOnly) {               // apporta cambiamenti solo sui campi che sono editabili
                //console.log("property name: " + property.name + " property value = " + property.value);
                /*
                if (property.value.toString().length == 0) {   // solo per test, dopo togliere
                    console.log("name: " + property.name + " è un campo nullo!");
                }
                */
                myParameters += "&users[0][" + property.name + "]=" + property.value.toString().escapeSpecialChars();
                // console.log(myParameters);          
            }
        }
    }
    //console.log("web service: " + myParameters);
    WebServiceModule(myParameters);                 // effettua update tramite web service

}

function onPropertyCommitted(args) {
    // console.log("Success: property has been committed");    // questa stringa mi fa capire quando e come vengono modificati gli elementi durante l'immissione da tastiera
}

function onNavigatingTo(args) {
    // console.time('profile1');
    const page = args.object;
    var myFunction = "core_user_get_users&criteria[0][key]=username&criteria[0][value]=";

    if (page.navigationContext) {
        // in questo caso evitare che vengano modificati i campi
        var gotData = page.navigationContext;
        myFunction += gotData.username;
        user = gotData.username;
    }
    else {
        user = localStorage.getItem("utente").username;
        myFunction += user;
    }

    var response = WebServiceModule(myFunction);                // effettua richiesta tramite web service
    response.then((data) => {
        // userId = data['users'][0].id;
        // console.timeEnd('profile1');
        buildLayout(page, pageData, data, user);
    });
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.onEdit = onEdit;
exports.onTap = onTap;
exports.onPropertyCommitted = onPropertyCommitted;