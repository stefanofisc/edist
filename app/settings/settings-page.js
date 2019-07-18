const app = require("tns-core-modules/application");
const SettingsViewModel = require("../shared/view-model");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const listViewModule = require("tns-core-modules/ui/list-view");
const WebServiceModule = require("../shared/web-service");
const utilsModule = require("tns-core-modules/utils/utils");
const logout = require("../shared/functions").onLogout;
const SelectedPage = require("../shared/selected-page-service");


// const switchModule = require("tns-core-modules/ui/switch");

var settings = [];

function onNavigatingTo(args) {
    const page = args.object;
    var listView = page.getViewById("list-group");

    if (listView.items) {
        /* Backward navigation - aggiorniamo la pagina attuale */
        SelectedPage.getInstance().updateSelectedPage("Settings");
        return;
    }
    buildLayout(page, listView);
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function buildLayout(page, listView) {
    if (!page.navigationContext) {
        var predefinedSettings = [
            {
                header: "Personali",
                item: "Profilo",
                iconurl: "http://192.167.9.181/server/icons/user.png",
                width: "auto"
            },
            {
                item: "Impostazioni Avanzate",
                iconurl: "http://192.167.9.181/server/icons/settings.png"
            },
            {
                header: "Sito",
                item: "About",
                iconurl: "http://192.167.9.181/server/icons/about.png",
                width: "auto"
            },
            {
                header: "Logout",
                item: "Logout",
                iconurl: "http://192.167.9.181/server/icons/play.png",
                width: "auto",
                customarrow: " "
            }
        ];
        settings = predefinedSettings;
        let myObservableArray = new ObservableArray(settings);
        page.bindingContext = new SettingsViewModel("Impostazioni", "Settings", myObservableArray);
        listView = setOnItemTap(page, listView);
    }
    else {
        settings = [];
        var gotData = page.navigationContext;
        var getSiteInfo = gotData.ws;
        var userToken = localStorage.getItem("utente").token;
        var response = WebServiceModule(getSiteInfo, userToken);
        response.then((data) => {
            for (let k in data) {
                if (data.hasOwnProperty(k) && k != "functions" && k != "advancedfeatures") {
                    // console.log(k + " -> " + data[k]);
                    let item = {
                        header: k,
                        item: data[k],
                        width: "auto",
                        customarrow: " "
                    };
                    settings.push(item);
                }
            }
            let myObservableArray = new ObservableArray(settings);
            page.bindingContext = new SettingsViewModel("About", "Settings", myObservableArray);
            listView = openUrl(listView);
        });
    }
}

function openUrl(listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        var selectedItem = args.index;
        if (settings[selectedItem].header.includes("url")) {
            utilsModule.openUrl(settings[selectedItem].item);
        }
    });
}

function setOnItemTap(page, listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        // in base all'elemento selezionato naviga in uno specifico modulo di impostazioni
        var selectedItem = args.index;
        var modName;
        var navigationParams;
        switch (selectedItem) {
            case 0:
                modName = "myprofile/myprofile-page";
                navigationParams = {        // questo poi va messo fuori dagli if perchè è comune a tutti
                    moduleName: "settings/" + modName,
                    //backstackVisible: false   // l'ho tolto perchè ho problemi con la seguente navigazione: 1 impostazioni -> 2 visualizza -> 3 profilo -> 4 impostazioni -> 5 visualizza -> 6 profilo. Quando torno indietro a 3 mi esce una schermata bianca
                }
                page.frame.navigate(navigationParams); break;
            case 1:
                navigationParams = {
                    moduleName: "settings/advanced/advanced-page",
                    context: {
                        ws: "core_user_get_user_preferences&userid=0"
                    }
                };
                page.frame.navigate(navigationParams); break;
            case 2:
                navigationParams = {
                    moduleName: "settings/settings-page",
                    context: {
                        ws: "core_webservice_get_site_info"
                    }
                };
                page.frame.navigate(navigationParams); break;
            case 3:
                logout();
                break;
            default: alert("altro");
        }
    });
    return listView;
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
