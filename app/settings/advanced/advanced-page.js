const app = require("tns-core-modules/application");
const SettingsViewModel = require("../../shared/view-model");
// const WebServiceModule = require("../../shared/web-service");
// const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
// const observableModule = require("tns-core-modules/data/observable");
// // >> switch-require
// const switchModule = require("tns-core-modules/ui/switch");
// // << switch-require

// var settings = [];

// function createSwitch(page) {
//     const vm = new observableModule.Observable();
//     vm.set("swResult", "false");
//     const stackLayout = page.getViewById("stackLayoutId");

//     // >> creating-switch-code
//     // creating new Switch and binding the checked property
//     const mySwitch = new switchModule.Switch();
//     const options = {
//         sourceProperty: "isChecked",
//         targetProperty: "checked"
//     };
//     mySwitch.bind(options, vm);
//     mySwitch.on("checkedChange", (args) => {
//         console.log(args.object.checked);
//         // >> (hide)
//         vm.set("swResult", args.object.checked);
//         // << (hide)
//     });

//     // setting up mySwitch.checked to true via binding
//     vm.set("isChecked", true);

//     // The above code is equivalent to binding via the XML
//     /*
//         <Switch checked="{{ isChecked }}">
//     */

//     // adding the created element to already existing layout
//     stackLayout.addChild(mySwitch);
//     // << creating-switch-code
//     page.bindingContext = vm;
// }

function onNavigatingTo(args) {
    const page = args.object;
    page.bindingContext = new SettingsViewModel("Impostazioni avanzate", "Advanced");
    // var listView = page.getViewById("list-group");

    // if (listView.items) {
    //     // console.log("list view already exists, exit!");
    //     return;
    // }
    if (page.navigationContext) {
        // createSwitch(page);
        // settings = [];
        // var gotData = page.navigationContext;
        // var getUserPreferences = gotData.ws;
        // var response = WebServiceModule(getUserPreferences, localStorage.getItem("utente").token);
        // response.then((data) => {
        //     for (let i = 0; i < data['preferences'].length; i++) {
        //         let item = {
        //             item: data['preferences'][i].name,
        //             swResult: ""
        //         };
        //         settings.push(item);
        //     }
        //     var myObservableArray = new ObservableArray(settings);
        //     page.bindingContext = new SettingsViewModel("Impostazioni avanzate", "Advanced", myObservableArray);
        // });
    }
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;