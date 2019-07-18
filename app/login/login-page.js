const app = require("tns-core-modules/application");
const LoginViewModel = require("../shared/view-model");
const Observable = require("tns-core-modules/data/observable").Observable;
const DataFormCommitMode = require("nativescript-ui-dataform").DataFormCommitMode;
const DataFormValidationMode = require("nativescript-ui-dataform").DataFormValidationMode;
const checkErrors = require("../shared/functions").checkErrors;
const getRoot = require("../app-root/app-root").getRoot;
const http = require("tns-core-modules/http");
const WebServiceModule = require("../shared/web-service");
const openUrl = require("tns-core-modules/utils/utils").openUrl;

var dataform = new Observable();
var token;

function onLoaded(args) {
    // console.time('onLoaded');
    const page = args.object;
    page.bindingContext = new LoginViewModel("Login", "Login");

    // impedisci di accedere alla barra di navigazione
    var sideDrawer = app.getRootView();
    sideDrawer.allowEdgeSwipe = false;

    // inizializza il dataform
    dataform = {
        username: "luca.landolfi",
        password: "#Password1"
    };
    page.bindingContext.set("dataform", dataform);
    // setta la convalida dei campi
    dataform = page.getViewById("myDataForm");
    dataform.commitMode = DataFormCommitMode.Immediate;
    dataform.validationMode = DataFormValidationMode.Immediate;
    // console.timeEnd('onLoaded');
}

function onLogin(args) {
    // console.time('onLogin');
    const button = args.object;
    const page = button.page;
    const myDataForm = page.getViewById("myDataForm");

    if (checkErrors(myDataForm)) {
        return;
    }
    // se non ci sono stati errori, prendi dati dal form
    var username = myDataForm.getPropertyByName("username").value.toString();
    var password = myDataForm.getPropertyByName("password").value.toString();

    // sottometti richiesta di login al server moodle
    var ip_addr = getRoot();
    var content = new FormData();
    var url = ip_addr + "/moodle/login/token.php";
    content.append("username", username);
    content.append("password", password);
    content.append("service", "moodle_mobile_app");

    var request = http.request({ url: url, method: 'POST', content: content });
    request.then((res) => {
        console.log("status code: " + res.statusCode);
        if (res.statusCode === 200) {   // handle server response
            console.log("content: " + res.content);
            var responseObject = JSON.parse(res.content);
            if (responseObject.token) { // credenziali corrette -> prendi il token di sessione
                token = responseObject.token;
                // console.log("token: " + token);
            }
            else if (responseObject.errorcode) {    // handle error
                alert("Invalid login, please try again");
                // console.log("error: " + responseObject.error);
                // console.log("errorcode: " + responseObject.errorcode);
                // console.log("stacktrace: " + responseObject.stacktrace);
                // console.log("debuginfo: " + responseObject.debuginfo);
                // console.log("reproductionlink: " + responseObject.reproductionlink);
                return;
            }
            if (token != undefined) {
                // login andato a buon fine, prendi id dell'utente
                var getUserId = "core_user_get_users&criteria[0][key]=username&criteria[0][value]=" + username;
                // console.log(getUserId);
                var response = WebServiceModule(getUserId);
                response.then((data) => {
                    if (data.errorcode) {
                        console.log(data);
                    }
                    else {
                        userid = data['users'][0].id;
                        fullname = data['users'][0].fullname;
                        // console.log("username: " + fullname);
                        // console.log("userid: " + userid);

                        // setto i parametri di navigazione
                        var navigationParam = {
                            moduleName: 'home/home-page',
                            context: {
                                fullname: fullname,
                                username: username,
                                userid: userid,
                                token: token
                            },
                            clearHistory: true                  // impedisco che da /home si possa tornare a /login
                        }
                        page.frame.navigate(navigationParam);
                    }
                });
            }
        }
        else {  // gestione risposta errata dal server
            alert("Errore");
            // console.log("Errore risposta dal server.\nstatus code: ");
            // console.log(res.statusCode);
            // console.log("headers: ");
            // console.log(res.headers);
        }
        // console.timeEnd('onLogin');
        return res;
    }, (e) => {
        console.log(e);
        return e;
    });
}

function onLostPassword(args) {
    openUrl("https://uniparthenope.esse3.cineca.it/Anagrafica/PasswordDimenticata.do");
}

function onMoodleTap(args) {
    openUrl("https://moodle.org/");
}

exports.onLoaded = onLoaded;
exports.onLogin = onLogin;
exports.onLostPassword = onLostPassword;
exports.onMoodleTap = onMoodleTap;