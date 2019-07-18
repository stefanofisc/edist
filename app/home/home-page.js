const app = require("tns-core-modules/application");
const HomeViewModel = require("../shared/view-model");
var gestures = require("tns-core-modules/ui/gestures");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const Observable = require("tns-core-modules/data/observable").Observable;
const listViewModule = require("tns-core-modules/ui/list-view");
const WebServiceModule = require("../shared/web-service");
const buildJSONitem = require("../shared/functions").buildJSONitem;
const setNavigationParams = require("../shared/functions").setNavigationParams;
const utilsModule = require("tns-core-modules/utils/utils");
const Image = require("tns-core-modules/ui/image").Image;
const Label = require("tns-core-modules/ui/label").Label;
const Button = require("tns-core-modules/ui/button").Button;
const logout = require("../shared/functions").onLogout;
const SelectedPage = require("../shared/selected-page-service");

var homepageItems = [];
// const initButton = require("../shared/functions").initButton;

// HOMEPAGE - GENERAL
function onNavigatingTo(args) {
    const page = args.object;

    const listView1 = page.getViewById("recentcourses-list-group");
    const listView2 = page.getViewById("mycourses-list-group");
    const listView3 = page.getViewById("starredcourses-list-group");
    if (listView1.items || listView2.items || listView3.items) {
        /* Backward navigation - aggiorniamo la pagina attuale */
        SelectedPage.getInstance().updateSelectedPage("Home");
        return;
    }
    page.bindingContext = new HomeViewModel("Home", "Home");

    var sideDrawer = app.getRootView(); // se vieni da login-page abilita la side drawer
    if (!sideDrawer.allowEdgeSwipe) {
        sideDrawer.allowEdgeSwipe = true;
    }

    if (page.navigationContext) {
        // prendi i dati di sessione

        var gotData = page.navigationContext;
        localStorage.setItemObject("utente", {
            fullname: gotData.fullname,
            username: gotData.username,
            id: gotData.userid,           // id dell'utente con matricola 0124001255, da determinare con get_user_by_field
            token: gotData.token
        });
    }

}

// >> tab-view-navigation-code
function onLoaded(args) {
    // console.time('home');
    const tabView = args.object;
    const page = tabView.page;
    const category = page.getViewById("category");
    const search = page.getViewById("search");
    const vm = new Observable();
    const listView1 = page.getViewById("recentcourses-list-group");
    const listView2 = page.getViewById("mycourses-list-group");
    const listView3 = page.getViewById("starredcourses-list-group");
    const isLoaded = page.getViewById("isLoaded");
    const facebook = page.getViewById("fb");
    const youtube = page.getViewById("yt");
    const instagram = page.getViewById("ig");
    const twitter = page.getViewById("tw");

    vm.set("tabSelectedIndex", 0);

    if (listView1.items || listView2.items || listView3.items) {
        console.log("list view already exists, return");
        return;
    }

    if (isLoaded.text == "0") {
        category.on(gestures.GestureTypes.tap, () => {
            page.frame.navigate("browse/browse-page");
        });
        search.on(gestures.GestureTypes.tap, () => {
            page.frame.navigate("search/search-page");
        });
        facebook.on(gestures.GestureTypes.tap, () => {
            utilsModule.openUrl("https://www.facebook.com/Parthenope");
        });
        youtube.on(gestures.GestureTypes.tap, () => {
            utilsModule.openUrl("https://www.youtube.com/channel/UCNBZALzU97MuIKSMS_gnO6A");
        });
        instagram.on(gestures.GestureTypes.tap, () => {
            utilsModule.openUrl("https://www.instagram.com/uniparthenope/");
        });
        twitter.on(gestures.GestureTypes.tap, () => {
            utilsModule.openUrl("https://twitter.com/uniparthenope");
        });

        tabView.bindingContext = vm;
        isLoaded.text = "1";
    }
    // console.timeEnd('home');
}

// displaying the old and new TabView selectedIndex
function onSelectedIndexChanged(args) {
    const tabView = args.object;
    const page = tabView.page;
    const listView1 = page.getViewById("recentcourses-list-group");
    const listView2 = page.getViewById("mycourses-list-group");
    const listView3 = page.getViewById("starredcourses-list-group");

    if (args.oldIndex !== -1) {
        const newIndex = args.newIndex;
        const vm = args.object.bindingContext;
        if (newIndex === 0) {   // azioni home page
            buildHomePage(vm);
        }
        else if (newIndex === 1) {    // azioni dashboard
            if (listView1.items || listView2.items || listView3.items) {
                console.log("list view already exists, return 2");
                return;
            }
            buildDashboard(page, listView1, listView2, listView3, vm);
        }
    }
}

function buildHomePage(vm) {
    // do something...
}

function buildDashboard(page, listView1, listView2, listView3, vm) {
    // var getDashboardBlocks = "core_block_get_dashboard_blocks&userid=" + localStorage.getItem("utente").id;
    // var response = WebServiceModule(getDashboardBlocks);
    // response.then( (data) => {
    // aggiungi qui le operazioni sui blocchi principali della dashboard
    // });

    // Passo 1 - con la web services seguente prendiamo tutti i corsi dell'utente ed inizializziamo i primi due blocchi della dashboard
    // Blocco 1: my recent courses
    // Blocco 2: my courses
    // console.time('buildDashboard');
    const starred = page.getViewById("starred");
    const recent = page.getViewById("recent");
    const usercourses = page.getViewById("courses");

    var getUserCourses = "core_enrol_get_users_courses&userid=" + localStorage.getItem("utente").id;

    var response = WebServiceModule(getUserCourses, localStorage.getItem("utente").token);
    response.then((data) => {
        var courses = [];
        var recentCourses = [];
        var starredCourses = [];
        // courses.push(initCategory("courses"));
        // recentCourses.push(initCategory("recent"));
        // starredCourses.push(initCategory("starred"));

        for (let i = 0; i < data.length; i++) {
            let item = buildJSONitem(data[i]);
            if (data[i].lastaccess != null) {
                recentCourses.push(item);
            }
            if (data[i].isfavourite == true) {
                starredCourses.push(item);
            }
            courses.push(item);
        }
        var myStarredCourses = new ObservableArray(starredCourses);
        var myRecentCourses = new ObservableArray(recentCourses);
        var myCourses = new ObservableArray(courses);

        var a = 0, b = 0, c = 0;
        if (!isEmpty(myStarredCourses)) {
            vm.set("starredCourses", myStarredCourses);
            listView3 = setOnItemTap(page, listView3, starredCourses);
            starred.text = "Preferiti";
            starred.height = 80;
            a = 1;
        }
        if (!isEmpty(recentCourses)) {
            vm.set("recentCourses", myRecentCourses);
            listView1 = setOnItemTap(page, listView1, recentCourses);
            recent.text = "Corsi recenti";
            recent.height = 80;
            b = 1;
        }
        if (!isEmpty(myCourses)) {
            vm.set("myCourses", myCourses);
            listView2 = setOnItemTap(page, listView2, courses);
            usercourses.text = "I miei corsi";
            usercourses.height = 80;
            c = 1;
        }
        if (a == 0 && b == 0 && c == 0) {   // Dashboard vuota
            const dashboardLoaded = page.getViewById("dashboardLoaded");
            if (dashboardLoaded.text == "1") {
                return;
            }
            dashboardLoaded.text = 1;
            const container = page.getViewById("my-dashboard");
            // risolvi problema backward navigation, si crea nuova istanza
            var label = new Label();
            label.id = "dashboard-void-label";
            label.text = "Cosa vuoi imparare? Ti raccomanderemo i corsi giusti.";
            label.textWrap = true;
            label.textAlignment = "center";
            label.fontSize = 20;
            var image = new Image();
            image.src = "http://192.167.9.181/server/icons/dashboard_void.png";
            image.className = "dashboard-void-image";
            var button = new Button();
            button.text = "Cerca nuovi corsi";
            button.id = "btn-primary";
            button.textWrap = true;
            button.on(gestures.GestureTypes.tap, () => {
                page.frame.navigate("browse/browse-page");
            });
            container.addChild(image);
            container.addChild(label);
            container.addChild(button);
        }
        // console.timeEnd('buildDashboard');
        // var navigationParams = {
        //     moduleName: "browse/browse-page",
        //     filename: "Cerca corsi"
        // }
        // initButton(page, navigationParams, "btn-primary", container);
    });

    // Passo 2 - prendi info sui files privati dell'utente
    // var getPrivateFilesInfo = "core_user_get_private_files_info&userid=" + localStorage.getItem("utente").id;
    // var userToken = localStorage.getItem("utente").token;

    // var response1 = WebServiceModule(getPrivateFilesInfo, userToken);
    // response1.then((data) => {
    //     if (data) {
    //         var filecount = data.filecount;
    //         var filesize = data.filesize; // da convertire in MB, credo che la ws ci dia il risultato in bytes
    //         vm.set("myPrivateFilesInfo", "I tuoi file: " + filecount + "\n Hai utilizzato " + filesize + " bytes del tuo storage");
    //     }
    // });
}

function setOnItemTap(page, listView, element) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        const tappedItemIndex = args.index;
        if (!element[tappedItemIndex].rootid) {
            var modName = 'course/course-page';
            var ws = "core_course_get_contents&courseid=" + element[tappedItemIndex].id;
            var navigationParams = setNavigationParams(modName, ws, element[tappedItemIndex].item, element[tappedItemIndex].id);
            page.frame.navigate(navigationParams);
        }
    });
    return listView;
}

function isEmpty(array) {
    if (array.length < 1) { // < 2
        return true;
    }
    return false;
}

function onLogout(args) {
    logout();
}

// setta il primo elemento del grid layout della dashboard
// function initCategory(catname) {
//     var item;
//     var shortname;
//     if (catname == "starred") {
//         shortname = "Preferiti";
//     } else if (catname == "recent") {
//         shortname = "Corsi recenti";
//     } else if (catname == "courses") {
//         shortname = "I miei corsi";
//     }
//     else {
//         console.error("Invalid input");
//         return;
//     }
//     item = {
//         rootname: shortname,
//         rootid: catname,
//         rootelement: "root",
//         noicon: " "
//     };
//     return item;
// }

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}
exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.onLoaded = onLoaded;
exports.onSelectedIndexChanged = onSelectedIndexChanged;
exports.onLogout = onLogout;
// function changeTab(args) { // questa function si riferiva ad un bottone che c'era e se lo premevi ti passava all'altro elemento della tab view
//     const vm = args.object.bindingContext;
//     const tabSelectedIndex = vm.get("tabSelectedIndex");

//     if (tabSelectedIndex === 0) {
//         vm.set("tabSelectedIndex", 1);
//     }
//     else if (tabSelectedIndex === 1) {
//         vm.set("tabSelectedIndex", 0);
//     }
// }
// << tab-view-navigation-code
/*********************************************************** */
