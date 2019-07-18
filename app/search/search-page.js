const app = require("tns-core-modules/application");
const SearchViewModel = require("../shared/view-model");
// const searchBarModule = require("tns-core-modules/ui/search-bar");
const WebServiceModule = require("../shared/web-service");
const listViewModule = require("tns-core-modules/ui/list-view");
const manageCourseAccess = require("../shared/functions").manageCourseAccess;
const courseTeacher = require("../shared/functions").courseTeacher;
const buildJSONitem = require("../shared/functions").buildJSONitem;
const Observable = require("tns-core-modules/data/observable").Observable;
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const SelectedPage = require("../shared/selected-page-service");

function onNavigatingTo(args) {
    // console.time('header');
    const page = args.object;
    const myLabel = page.getViewById("search-result-header");
    if (myLabel.text) {
        /* Backward navigation - aggiorniamo la pagina attuale */
        SelectedPage.getInstance().updateSelectedPage("Search");
        return;
    }
    const container = page.getViewById("container");
    const listView = page.getViewById("list-group");
    const vm = new Observable();
    vm.set("title", "Cerca corsi");
    page.bindingContext = vm;       // qui bisogna settare il valore di selected page service perchè altrimenti dal sidedrawer riconosce la pagina precedente
    SelectedPage.getInstance().updateSelectedPage("Search");
    // console.timeEnd('header'); -> trascurabile: 2ms
    if (page.navigationContext) {
        console.time('layout');
        gotData = page.navigationContext;

        // Mostra risultati della ricerca
        var response = WebServiceModule(gotData.ws);  
        response.then(function (data) {
            if (data.total === 0) {
                myLabel.className = "search-no-result";
                myLabel.text = "Nessun corso trovato!";
                container.addChild(myLabel);

            } else {      // Scorri data['courses'] e stampa corsi
                var courses = [];
                courses = getCourses(data['courses']);
                var myObservableArray = new ObservableArray(courses);
                page.bindingContext = new SearchViewModel("Cerca corsi", "Search", myObservableArray);
                console.timeEnd('layout');
                // onItemTap
                listView.on(listViewModule.ListView.itemTapEvent, (args) => {   // Verifica quale corso è stato selezionato
                    const tappedItemIndex = args.index;
                    manageCourseAccess(page, courses[tappedItemIndex]);
                });
                myLabel.text = "Risultati di ricerca: " + data.total;
                container.addChild(myLabel);
            }
        });
    }
}

// prendi i dati dei corsi e restituiscili in output per costruire radlistview
// questa function è richiamata anche da browse-page
function getCourses(dataCourses) {
    var courses = [];
    for (let i = 0; i < dataCourses.length; i++) {
        var teacher = "";
        if (courseTeacher(dataCourses[i]['contacts'])) {  // verifica se al corso sono associati degli insegnanti
            teacher = dataCourses[i]['contacts'][0].fullname;
        }
        let items = buildJSONitem(dataCourses[i], true, teacher);
        courses.push(items);
    }
    return courses;
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function onSubmit(args) {       // Gestisci l'evento della SearchBar 'submit'.
    console.time('onsubmit');
    const searchBar = args.object;
    //const searchValue = searchBar.text.split(" ")[0]; 
    const searchValue = searchBar.text.replace(" ", "%20");
    const page = searchBar.page;

    if (searchValue !== "") {
        // Ricerca il corso con la web service di Moodle
        var myFunction = "core_course_search_courses&criterianame=search&criteriavalue=" + searchValue;
        var navigationParams = {
            moduleName: "search/search-page",
            context: {
                ws: myFunction
            },
            //backstackVisible: false
        };

        page.frame.navigate(navigationParams);
        console.timeEnd('onsubmit');
    }
    // console.log("Search submit result: ", searchBar.text);
}

function onClear(args) {        // Gestisci l'evento della SearchBar `clear`.
    const searchBar = args.object;
    searchBar.text = "";
    searchBar.hint = "Cerca un corso...";
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.onSubmit = onSubmit;
exports.onClear = onClear;
exports.getCourses = getCourses;
