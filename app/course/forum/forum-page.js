const app = require("tns-core-modules/application");
const ForumViewModel = require("../../shared/view-model");
const stripHtmlTags = require("../../shared/functions").stripHtmlTags;
const initButton = require("../../shared/functions").initButton;
const WebServiceModule = require("../../shared/web-service");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const listViewModule = require("tns-core-modules/ui/list-view");
const timestampconvert = require("../../shared/functions").timestampconvert;
const Image = require("tns-core-modules/ui/image").Image;
const setIcon = require("../../course/course-page").setIcon;
const gestures = require("tns-core-modules/ui/gestures");
const Label = require("tns-core-modules/ui/label").Label;

// const SelectedPageService = require("../../shared/selected-page-service");
// SelectedPageService.getInstance()._selectedPageSource.value -> return nome pagina attuale

var discussions = [];

function buildForum(page, gotData) {
    const listView = page.getViewById("list-group")
    if (listView.items) {
        // non ricostruire il layout di pagina
        return;
    }
    // Ricava id del forum grazie all'id del corso che hai in gotData
    var getForum = "mod_forum_get_forums_by_courses&courseids[0]=" + gotData.courseid;
    var response = WebServiceModule(getForum);
    response.then((data) => {
        discussions = [];
        var forumInfo = {
            id: data[0].id,
            intro: data[0].intro
        };

        // prendi il token dell'utente connesso
        var currentUserToken = localStorage.getItem("utente").token;

        // 1. Ottieni discussioni del forum 

        var sortby = "timemodified"; //sort by this element: id, timemodified, timestart or timeend
        var sortdirection = "DESC"; // ASC or DESC
        var cpage = -1;              // Default to "-1" current page
        var perpage = 0;            // Default to "0" items per page 
        var getForumDiscussionsWS = "mod_forum_get_forum_discussions_paginated&forumid=" + forumInfo.id + "&sortby=" + sortby + "&sortdirection=" + sortdirection + "&page=" + cpage + "&perpage=" + perpage;
        var getForumDiscussions = WebServiceModule(getForumDiscussionsWS);
        getForumDiscussions.then((data) => {
            for (let i = 0; i < data['discussions'].length; i++) {
                // verifica se ci sono file in allegato
                let attachment = [];
                if (data['discussions'][i].attachment != "") {
                    // la discussione ha degli allegati
                    for (let j = 0; j < data['discussions'][i].attachments.length; j++) {
                        attachment.push({
                            filename: data['discussions'][i].attachments[j].filename,
                            filetype: data['discussions'][i].attachments[j].mimetype,
                            fileurl: data['discussions'][i].attachments[j].fileurl + "?forcedownload=1&token=" + localStorage.getItem("utente").token
                        });
                    }
                }
                // build discussionObject, mettiamo tutto quello che ci serve una volta che navighiamo in forum-page (discussione specifica con tutti i post) 
                let numReplies = data['discussions'][i].numreplies; // numero di risposte alla discussione
                let author = data['discussions'][i].userfullname;
                let discussionObject = {
                    // moduleName: "course/forum/forum-page",
                    filename: data['discussions'][i].name,
                    postid: data['discussions'][i].id,
                    discussionid: data['discussions'][i].discussion,
                    token: currentUserToken,
                    attachment: attachment,
                    author: author,
                    date: "\n" + timestampconvert(data['discussions'][i].created),
                    numReplies: numReplies,
                    imageurl: data['discussions'][i].userpictureurl,
                    imageVisibility: "visible",
                    columns: "100, *",
                    imgcol: "0",
                    grdcol: "1"
                };
                discussions.push(discussionObject);
            }
            var myObservableArray = new ObservableArray(discussions);
            page.bindingContext = new ForumViewModel(gotData.filename, "Forum", myObservableArray);
        });
        // 2. Verifica se l'utente ha i permessi per aggiungere nuovi post in quel forum
        const buttonContainer = page.getViewById("forum-page-buttons");
        localStorage.setItem("isEditingTeacher", false); // to comment ?
        if (currentUserToken != undefined) {
            canAddDiscussion(forumInfo.id, currentUserToken).then((data) => {
                if (data.status == true) {
                    // naviga verso il modulo di creazione post
                    let moduleName = "course/forum/addpost/addpost-page";
                    let webService = "mod_forum_add_discussion&forumid=" + forumInfo.id;
                    let item = {
                        moduleName: moduleName,
                        filename: "New",
                        title: "New post",
                        forumid: forumInfo.id,
                        token: currentUserToken,
                        ws: webService
                    }
                    let col = 1;
                    // abilita bottone di crea post
                    initButton(buttonContainer.page, item, "btn-primary", buttonContainer, true, col);
                    localStorage.setItem("isEditingTeacher", true);
                    // console.log("item-page: " + localStorage.getItem("isEditingTeacher"));
                }
            });
        }
    });
}

function canAddDiscussion(forumid, token) {
    // verifica se l'utente connesso può aggiungere nuovi post
    // ws: mod_forum_can_add_discussion ; token: prendi token da token.json dove username = localStorage.getItem("utente").username
    // input: forum id, group id = 3 (editing teacher)
    // output: boolean

    // se la web service restituisce true -> mostra il form per la creazione di una nuova discussione
    // altrimenti l'utente non può aggiungere una discussione in quel forum
    var myFunction = "mod_forum_can_add_discussion&forumid=" + forumid + "&groupid=3";
    console.log(myFunction);
    var response = WebServiceModule(myFunction, token);
    response.then((data) => {
        if (data.status == true) {
            console.log("crea form");
        }
        else if (data.status == false) {
            // l'utente non può creare post in questo forum
            console.log("non puoi creare post in questa sezione");
        }
        else {
            console.log(data.errorcode);
            console.log(data.exception);
            console.log(data.message);
        }
    });
    return response;
}

function setOnItemTap(page, listView) {
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        const tappedItemIndex = args.index;
        if (!discussions[tappedItemIndex].id) {
            var navigationParams = {
                moduleName: 'course/forum/forum-page',
                context: discussions[tappedItemIndex]
            };
            page.frame.navigate(navigationParams);
        }
    });
    return listView;
}

function buildDiscussionLayout(page, gotData) {
    const buttonContainer = page.getViewById("forum-page-buttons");
    const itemContainer = page.getViewById("item");
    // effettua web service per verificare se la discussione ha delle risposte, ed in tal caso mostrarle

    var sortby = "created";     // Default to "created" , sort by this element: id, created or modified
    var sortdirection = "ASC";  // Default to DESC, ASC or DESC
    var getPosts = "mod_forum_get_forum_discussion_posts&discussionid=" + gotData.discussionid + "&sortby=" + sortby + "&sortdirection=" + sortdirection;

    var response = WebServiceModule(getPosts);

    response.then((data) => {
        // Mostra le risposte della discussione del forum aperta
        // costruisci oggetto json posts con i dati della ws e passalo a bindingcontext
        var posts = [];
        for (let i = 0; i < data['posts'].length; i++) {
            let item = {
                subject: data['posts'][i].subject,
                message: stripHtmlTags(data['posts'][i].message),
                author: data['posts'][i].userfullname,
                date: timestampconvert(data['posts'][i].created)
            }
            posts.push(item);
        }
        var myObservableArray = new ObservableArray(posts);
        page.bindingContext = new ForumViewModel(gotData.filename, "Discussion", myObservableArray);

        // Verifica se ci sono file in allegato, in tal caso crea bottoni che riportano ad item-page per mostrarli
        if (gotData.attachment.length > 0) {
            var token = localStorage.getItem("utente").token;
            for (let i = 0; i < gotData.attachment.length; i++) {
                attachment = {
                    moduleName: "course/item/item-page",
                    filename: gotData.attachment[i].filename,
                    filetype: gotData.attachment[i].filetype,
                    fileurl: gotData.attachment[i].fileurl + "&token=" + token
                };
                console.log("link allegato: " + attachment.fileurl);
                buildAttachment(page, itemContainer, attachment);
            }
        }

        // verifica se l'utente ha i permessi per aggiungere nuovi post in quel forum
        var isEditingTeacher = localStorage.getItem("isEditingTeacher");

        if (isEditingTeacher.toString() == "true") {
            // console.log("l'utente può rispondere ai post");
            let moduleName = "course/forum/addpost/addpost-page";
            let webService = "mod_forum_add_discussion_post&postid=" + gotData.postid;
            let item = {
                moduleName: moduleName,
                filename: "Add new post",
                title: "New post",
                token: gotData.token,
                ws: webService
            }
            let col = 1;
            initButton(page, item, "btn-primary", buttonContainer, true, col);
        }
        else {
            console.log("L'utente non è abilitato a rispondere ai post");
        }
    });
}

function buildAttachment(page, container, attachment) {
    const newImage = new Image();
    newImage.src = setIcon(attachment.filetype);
    newImage.className = "attachment";
    newImage.on(gestures.GestureTypes.tap, () => {
        let navigationParams = {
            moduleName: attachment.moduleName,
            context: attachment
        };
        page.frame.navigate(navigationParams);
    });
    const newImageName = new Label();
    newImageName.text = attachment.filename;
    newImageName.textAlignment = "center";
    newImageName.textWrap = true;
    newImageName.fontSize = 14;
    newImageName.className = "attachment-name";
    newImageName.on(gestures.GestureTypes.tap, () => {
        let navigationParams = {
            moduleName: attachment.moduleName,
            context: attachment
        };
        page.frame.navigate(navigationParams);
    });

    container.addChild(newImageName);
    container.addChild(newImage);
}

function onNavigatingTo(args) {
    const page = args.object;
    var listView = page.getViewById("list-group");

    if (listView.items) {
        // console.log("list view already exists, exit!");
        return;
    }

    if (page.navigationContext) {
        gotData = 0;
        gotData = page.navigationContext;

        if (gotData.courseid) {
            buildForum(page, gotData);
            listView = setOnItemTap(page, listView);
        }
        else {
            buildDiscussionLayout(page, gotData);
        }
    }
    else {
        // naviga verso error-page
        console.error("Impossibile visualizzare la discusssione");
    }
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

// function onPullToRefreshInitiated(args) {
//     setTimeout(() => {
//         const listView = args.object;
//         const page = SelectedPageService.getInstance()._selectedPageSource.value;
//         console.log(page);
//         listView.notifyPullToRefreshFinished();
//     }, 1000);
// }

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
// exports.onPullToRefreshInitiated = onPullToRefreshInitiated;