const app = require("tns-core-modules/application");
const FeaturedViewModel = require("../shared/view-model");
const WebServiceModule = require("../shared/web-service");
const listViewModule = require("tns-core-modules/ui/list-view");
const setNavigationParams = require("../shared/functions").setNavigationParams;
const buildJSONitem = require("../shared/functions").buildJSONitem;
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const unenrolUser = require("../shared/functions").unenrolUser;
const confirm = require("tns-core-modules/ui/dialogs").confirm;
const SelectedPage = require("../shared/selected-page-service");

var courses = [];

function onNavigatingTo(args) {
    const page = args.object;
    var listView = page.getViewById("list-group");

    if (listView.items) {
        /* Backward navigation - aggiorniamo la pagina attuale */
        SelectedPage.getInstance().updateSelectedPage("Featured");
        return;
    }
    buildLayout(page);
    // onItemTap
    listView = setOnItemTap(page, listView);
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function buildLayout(page) {
    // console.time('featured');
    courses = [];
    // Mostra tutti i corsi dell'utente connesso
    var myFunction = "core_enrol_get_users_courses&userid=" + localStorage.getItem("utente").id;

    var response = WebServiceModule(myFunction, localStorage.getItem("utente").token);
    response.then((data) => {
        // var courses = [];
        for (let i = 0; i < data.length; i++) {
            let item = buildJSONitem(data[i]);
            courses.push(item);
            //courses.push(JSON.parse(item));
        }

        // inizializza gli elementi della lista
        var myObservableArray = new ObservableArray(courses);
        page.bindingContext = new FeaturedViewModel("I miei corsi", "Featured", myObservableArray);
        page.bindingContext.set("isSortingEnabled", true);
        // console.timeEnd('featured');
    });
}

function setOnItemTap(page, listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        // console.time('itemtap');
        const tappedItemIndex = args.index;
        var modName = 'course/course-page';
        var ws = "core_course_get_contents&courseid=" + courses[tappedItemIndex].id;
        var navigationParams = setNavigationParams(modName, ws, courses[tappedItemIndex].item, courses[tappedItemIndex].id);
        page.frame.navigate(navigationParams);
        // console.timeEnd('itemtap');
    });
    return listView;
}

function onPullToRefreshInitiated(args) {
    setTimeout(() => {
        const listView = args.object;
        const page = listView.page;

        buildLayout(page);

        listView.notifyPullToRefreshFinished();
    }, 1000);
}

function onSwipeCellStarted(args) {
    const swipeLimits = args.data.swipeLimits;
    const swipeView = args.object;
    const rightItem = swipeView.getViewById("delete-view");
    swipeLimits.right = rightItem.getMeasuredWidth();
    swipeLimits.threshold = rightItem.getMeasuredWidth() / 2;
}

function onRightSwipeClick(args) {
    const page = args.object.page;
    const listView = page.getViewById("list-group");
    const confirmOptions = {
        title: "Disiscrivimi",
        message: "Vuoi disiscriverti dal corso?",
        okButtonText: "Disiscrivimi dal corso",
        cancelButtonText: "Annulla"
    };
    confirm(confirmOptions).then((result) => {
        if (result == true) {
            let userid = localStorage.getItem("utente").id;
            let tappedItemIndex = courses.indexOf(args.object.bindingContext);
            let courseid = courses[tappedItemIndex].id;
            unenrolUser(page, userid, courseid);
            const viewModel = listView.bindingContext;
            viewModel.dataItems.splice(viewModel.dataItems.indexOf(args.object.bindingContext), 1);
            // listView.notifySwipeToExecuteFinished();
        }
    });
    listView.notifySwipeToExecuteFinished();
}


exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.onPullToRefreshInitiated = onPullToRefreshInitiated;
exports.onSwipeCellStarted = onSwipeCellStarted;
exports.onRightSwipeClick = onRightSwipeClick;

// function onLeftSwipeClick(args) {
//     const page = args.object.page;
//     const listView = page.getViewById("list-group");
//     // prendi id del corso selezionato
//     const viewModel = listView.bindingContext;
//     let tappedItemIndex = viewModel.dataItems.indexOf(args.object.bindingContext);
//     let courseid = courses[tappedItemIndex].id;
//     var favourite = 1;

//     // TO-DO implementare funzione di rimozione corso dai preferiti
//     // let markview = page.getViewById("mark-view");
//     // let isStarred = markview.getViewById("isStarred");
//     // console.log("value");
//     // console.log(isStarred.text);
//     // if (falso) -> favourite = 0 

//     let setStarredCourse = "core_course_set_favourite_courses&courses[0][id]=" + courseid + "&courses[0][favourite]=" + favourite;
//     var response = WebServiceModule(setStarredCourse, localStorage.getItem("utente").token);
//     response.then((data) => {
//         if (data.errorcode) {
//             console.error(data);
//         }
//         else if (data['warnings'][0].warningcode) {
//             console.log(data['warnings'][0]);
//             alert(data['warnings'][0].message);
//         }
//         else {
//             // if (favourite == 1)
//             page.bindingContext.set("isStarredCourse", true);
//             // else page.bindingContext.set("isStarredCourse", false);
//         }
//     });

//     listView.notifySwipeToExecuteFinished();
// }
