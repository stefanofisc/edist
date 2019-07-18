const application = require("tns-core-modules/application");
const frameModule = require("tns-core-modules/ui/frame");
const AppRootViewModel = require("./app-root-view-model");
const SelectedPageService = require("../shared/selected-page-service");

var moodleServer = {
    ip_addr: "http://192.167.9.181",
    // token: "d9193a1ef948e89e37a58629bbe7c973"
}

function onLoaded(args) {
    const drawerComponent = args.object;
    drawerComponent.bindingContext = new AppRootViewModel();
    // console.log("onLoaded");
    // quando facciamo il logout dobbiamo ripulire queste variabili e reinizializzarle dopo il login
    // questo perchè se mi disconnetto e mi riconnetto con un nuovo utente, la barra non viene ricaricata
    // e mantiene i vecchi dati, quindi così non va bene

    if (localStorage.length > 0) {
        drawerComponent.bindingContext.set("fullname", localStorage.getItem("utente").fullname);
        drawerComponent.bindingContext.set("connectedAs", "Connected as: " + localStorage.getItem("utente").username);
    }
}

function onNavigationItemTap(args) {
    const component = args.object;
    const componentRoute = component.route;
    const componentTitle = component.title;
    const bindingContext = component.bindingContext;

    bindingContext.set("selectedPage", componentTitle); // nuova pagina selezionata
    
    // se stai navigando verso la pagina di login significa che hai cliccato su Logout
    // in tal caso effettua le seguenti azioni: 
    // pulisci la navigazione ed i dati di sessione acquisiti
    var clearHistory = false;
    if (componentTitle == "Login") {
        // const page = component.page;
        // const sideDrawerHeaderBrand = component.page.getViewById("fullname");
        // const footNote = component.page.getViewById("connectedas");
        // page non viene letto, infatti non viene dichiarato il tag page in app-root.xml

        // sideDrawerHeaderBrand.unbind("fullname");
        // footNote.unbind("connectedAs");

        clearHistory = true;
        localStorage.clear();
    }
    
    var currentpage = SelectedPageService.getInstance()._selectedPageSource.getValue();
    if (currentpage === componentTitle) {
        // console.log("Annulla navigazione verso la stessa pagina");
        return;
    }

    frameModule.topmost().navigate({
        moduleName: componentRoute,
        transition: {
            name: "fade"
        },
        clearHistory: clearHistory
    });

    const drawerComponent = application.getRootView();
    drawerComponent.allowEdgeSwipe = true;
    drawerComponent.closeDrawer();

}

function getRoot() {
    return moodleServer.ip_addr;
}

// Ho lasciato questa interfaccia per settare l'indirizzo ip dell'istanza Moodle dal quale l'app va a prendere i dati.
// si può integrare nell'interfaccia di login un bottone che manda ad una pagina per settare questi parametri
// l'utente configura così l'app su un'altra istanza Moodle.

// function getToken() {
//     return moodleServer.token;
// }
// function setRoot(ip) {
//     moodleServer.ip_addr = ip;
// }
// function setToken(token) {
//     moodleServer.token = token;
// }

exports.onLoaded = onLoaded;
exports.onNavigationItemTap = onNavigationItemTap;
exports.getRoot = getRoot;
// exports.getToken = getToken;