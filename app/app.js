/*
In NativeScript, the app.js file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/
require("./bundle-config");
require("nativescript-localstorage");
// var Downloader = require('nativescript-downloader').Downloader;
// Downloader.init(); // <= Try calling this after the app launches to start the downloader service
const application = require("tns-core-modules/application");

/*var frame = require("tns-core-modules/ui/frame");
if (application.android) {
    application.android.on(application.AndroidApplication.activityBackPressedEvent, backEvent);
}
function backEvent(args) {
    var currentPage = frame.topmost().currentPage;
    if (currentPage && currentPage.exports && typeof currentPage.exports.backEvent === "function") {
        currentPage.exports.backEvent(args);
    }
}
*/

application.run({ moduleName: "app-root/app-root" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
