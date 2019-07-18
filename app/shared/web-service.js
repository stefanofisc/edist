const httpModule = require("tns-core-modules/http");
const getRoot = require("../app-root/app-root").getRoot;
// const getToken = require("../app-root/app-root").getToken;

function WebServiceModule(myfunction, token = "6485635e03b23bcdd46ae80f7643b8c6") {
    const wwwroot = getRoot();
    const phpserver = "/moodle/webservice/rest/server.php?";
    const format = "json";

    myURL = wwwroot + phpserver + "wstoken=" + token + "&moodlewsrestformat=" + format + "&wsfunction=" + myfunction;
    // console.log("ricevo: " + myURL);
    var response = httpModule.getJSON(myURL).then(function (r) {
        // handle response
        return r;
    }, function (e) {
        // handle errors
        console.log(e);
        return e;
    }
    );
    // restituisce un oggetto Promise
    return response;
}

module.exports = WebServiceModule;