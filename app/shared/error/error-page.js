const app = require("tns-core-modules/application");

const ErrorViewModel = require("./error-view-model");

function onNavigatingTo(args) {
    const page = args.object;

    if (page.navigationContext) {
        var gotData = page.navigationContext;
        page.bindingContext = new ErrorViewModel(gotData);
    }
    else {
        console.error("Error-page: missing navigationContext");
    }
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
