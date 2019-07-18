const app = require("tns-core-modules/application");
const BrowseViewModel = require("../shared/view-model");
const WebServiceModule = require("../shared/web-service");
const listViewModule = require("tns-core-modules/ui/list-view");
const manageCourseAccess = require("../shared/functions").manageCourseAccess;
const setNavigationParams = require("../shared/functions").setNavigationParams;
const getCourses = require("../search/search-page").getCourses;
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const SelectedPage = require("../shared/selected-page-service");


var users = [];

function onNavigatingTo(args) {
    // console.time('browse');
    const page = args.object;
    const listView = page.getViewById("list-group");

    if (listView.items) {
        /* Backward navigation - aggiorniamo la pagina attuale */
        SelectedPage.getInstance().updateSelectedPage("Browse");
        return;
    }
    /* 
     * Verifica quali categorie mostrare nella pagina in base all'id ottenuto dal JSON.
     * Se stai accedendo per la prima volta a browse.xml allora verranno mostrate le macrocategorie, quelle con parent = 0.
     * Altrimenti stai sicuramente navigando tra le sottocategorie, quindi verifica il valore di id passato dalla pagina
     * precedente alla successiva, restituito nel navigationContext.
     * Il seguente modulo viene anche utilizzato per mostrare la lista dei partecipanti ad un corso.
    */
    var id = 0;
    var myFunction;
    if (page.navigationContext) {
        gotData = page.navigationContext;
        myFunction = gotData.ws;
        id = gotData.id;
        title = gotData.title;
    }
    else {
        myFunction = "core_course_get_categories";
        title = "Categorie di corso";
    }

    if (title == "Partecipanti") {
        showParticipants(page, listView, gotData.ws);
    }
    else {
        // Gestione navigazione tra categorie e corsi...
        var response = WebServiceModule(myFunction);
        response.then(function (data) {
            // Mostra categorie o corsi
            var categories = [];
            if (myFunction === "core_course_get_categories") {
                for (let i = 0; i < data.length; i++) {      // mostra solo le categorie richieste
                    if (data[i].parent == id) {
                        var info = "";
                        if (data[i].coursecount > 0) {
                            info = data[i].coursecount;
                            if (data[i].coursecount == 1) {
                                info += " corso";
                            }
                            else {
                                info += " corsi";
                            }
                        }
                        var image = setIcon(data[i].name);
                        let items = {
                            item: data[i].name,
                            id: data[i].id,
                            coursecount: data[i].coursecount,
                            info: info,
                            labelVisibility: "hidden",
                            imageVisibility: "visible",
                            imageurl: image
                        }
                        categories.push(items);
                    }
                }
            }
            else {
                categories = getCourses(data['courses']);
                const categoryCover = page.getViewById("category-cover");
                let categoryname = data['courses'][0].categoryname;
                let imageurl = setIcon(categoryname);
                categoryCover.src = imageurl;
            }
            var myObservableArray = new ObservableArray(categories);
            page.bindingContext = new BrowseViewModel(title, "Browse", myObservableArray);

            // onItemTap
            listView.on(listViewModule.ListView.itemTapEvent, (args) => {
                const tappedItemIndex = args.index;                                     // Verifica quale categoria/corso è stata selezionata/o

                var ws;
                if (categories[tappedItemIndex].coursecount >= 0) {
                    var modName = 'browse/browse-page';
                    var id = categories[tappedItemIndex].id;
                    title = categories[tappedItemIndex].item;
                    if (categories[tappedItemIndex].coursecount > 0) {                  // La categoria ha dei corsi, devi mostrare i corsi
                        ws = "core_course_get_courses_by_field&field=category&value=" + id;
                    }
                    else {                                                              // Devi mostrare sottocategorie
                        ws = "core_course_get_categories";
                    }
                    let navigationParams = setNavigationParams(modName, ws, title, id);
                    page.frame.navigate(navigationParams);
                }
                else {                                                                  // Devi mostrare il corso, naviga verso il modulo course
                    manageCourseAccess(page, categories[tappedItemIndex]);
                }
            });
            // console.timeEnd('browse');
        });
    }
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function showParticipants(page, listView, ws) {
    let response = WebServiceModule(ws);
    response.then((data) => {
        users = []; // pulisco l'array users, altrimenti durante la navigazione continua ad inserire elementi dentro e mostra elementi ridondanti
        for (let i = 0; i < data.length; i++) {
            // costruisci oggetto della lista
            var role = "Studente";
            if (data[i]['roles'][0].shortname === "editingteacher") {
                role = "Insegnante";
            }
            let item = {
                item: data[i].fullname,
                info: "Ruolo: " + role,
                username: data[i].username,
                customimage: "customimage",
                labelVisibility: "hidden",
                imageVisibility: "visible",
                imageurl: data[i].profileimageurl
                // imageurl: "https://image.flaticon.com/icons/png/128/149/149071.png"
                // userid: data[i].id
            }
            users.push(item);
        }
        // inizializza gli elementi della lista
        var myObservableArray = new ObservableArray(users);
        page.bindingContext = new BrowseViewModel(title, "Participants", myObservableArray);
        listView = onSelectedUser(page, listView);
    });
}

function onSelectedUser(page, listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        const tappedItemIndex = args.index;
        var navigationParams = {
            moduleName: 'settings/myprofile/myprofile-page',
            context: {
                username: users[tappedItemIndex].username
            }
        };
        page.frame.navigate(navigationParams);
    });
    return listView;
}

function setIcon(catname) {
    var iconurl;
    if (catname.includes("Triennali")) {
        iconurl = "http://192.167.9.181/server/icons/degree.jpg";
    } else if (catname.includes("Magistrali")) {
        iconurl = "http://192.167.9.181/server/icons/master.jpg";
    } else if (catname.includes("Dottorati")) {
        iconurl = "http://192.167.9.181/server/icons/doctorate.jpg";
    } else if (catname.includes("Machine Learning")) {
        iconurl = "http://192.167.9.181/server/icons/ai.jpg";
    } else if (catname.includes("Informatica")) {
        iconurl = "http://192.167.9.181/server/icons/computer-science.jpg";
    } else if (catname.includes("Biologiche")) {
        iconurl = "http://192.167.9.181/server/icons/biology.jpg";
    } else if (catname.includes("Ambientali")) {
        iconurl = "http://192.167.9.181/server/icons/chemistry.jpg";
    } else if (catname.includes("Aeronautiche")) {
        iconurl = "http://192.167.9.181/server/icons/atmosphere.jpg";
    }

    return iconurl;
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;