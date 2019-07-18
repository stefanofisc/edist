const app = require("tns-core-modules/application");
var gestures = require("tns-core-modules/ui/gestures");
const confirm = require("tns-core-modules/ui/dialogs").confirm;
const Image = require("tns-core-modules/ui/image").Image;
const utilsModule = require("tns-core-modules/utils/utils");
const PDFView = require('nativescript-pdf-view').PDFView;
const Video = require("nativescript-videoplayer").Video;
const ItemViewModel = require("../../shared/view-model");
const displayFileContent = require("../../shared/functions").displayFileContent;
const initLabel = require("../../shared/functions").initLabel;
const stripHtmlTags = require("../../shared/functions").stripHtmlTags;
const HtmlView = require("tns-core-modules/ui/html-view").HtmlView;
// const WebServiceModule = require("../../shared/web-service");
const Label = require("tns-core-modules/ui/label").Label;
const webViewModule = require("tns-core-modules/ui/web-view").WebView;


// const spawn = require("child_process").spawn;
// var Downloader = require('nativescript-downloader').Downloader; // se hai problemi prova a toglierlo dal file app.js
// Downloader.setTimeout(120); //Increase timeout default 60s

// var convertapi = require('convertapi')("vbncSCAAfNfpz19q");
// var CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
// api-key 1e0037ea-c828-4c3f-8529-d62a0033df6d

// Salva la risorsa nel percorso /data/org.nativescript.MoodleApp/cache/http
function download(gotData) {

    const confirmOptions = {
        title: gotData.filename,
        message: "Scarica",
        okButtonText: "Salva",
        cancelButtonText: "Annulla"
    };

    confirm(confirmOptions).then((result) => {
        if (result == true) {
            // test download con utilsModule, funziona e li salva in Downloads ma apre una pagina internet e vorrei evitare
            // if (isNotViewable(gotData.filetype) || gotData.filetype == "application/pdf") {  // Scarica documenti docx, pptx, pdf e archivi zip, jar, (TO DO: rar)
            if (app.ios) {
                utilsModule.ios.openFile(gotData.fileurl);
            }
            else {
                console.log("Downloading...");
                utilsModule.openUrl(gotData.fileurl);
            }
            alert(gotData.filename + " salvato in Download.");
            // }
            // test download con plugin nativescript downloader. funziona ma mi salva le risorse sotto /data/org.nativescript.MoodleApp/cache/http. Al contrario qui non mi apre la connessione ad internet.
            // else {
            //     var downloader = new Downloader();

            //     var fileDownloader = downloader.createDownload({
            //         url: gotData.fileurl
            //         // path: "getExternalFileDirs - consulta la documentazione Android tra i preferiti nel browser"
            //     });
            //     downloader
            //         .start(fileDownloader, progressData => {
            //             console.log(`Progress : ${progressData.value}%`);
            //         })
            //         .then(completed => {
            //             console.log(`Image : ${completed.path}`);
            //             alert(gotData.filename + " salvato in " + completed.path);
            //         })
            //         .catch(error => {
            //             console.log(error.message);
            //         });
            // }
        }
    });
}

// Quando l'utente clicca sul bottone di salvataggio, viene eseguita la function download
function saveFile(args) {
    download(fileToSave);
}

// verifica per quale tipologia di risorsa abilitare il tasto di salvataggio in alto a destra nella pagina 
function isDownloadable(filetype) {
    if (filetype != "forum" && !filetype.includes("video") && !filetype.includes("text") && filetype != "book" && filetype != "scorm") {
        return true;
    }
    return false;
}

// per le risorse che non possono essere visualizzate, come archivi zip, jar, rar, o per quelle risorse che ancora non riesci a visualizzare come .docx e pptx
// rimanda direttamente al loro download.
function isNotViewable(filetype) {
    if (filetype == "application/msword" || filetype == "application/vnd.ms-powerpoint" || filetype == "application/zip" ||
        filetype == "application/java-archive" || filetype == "application/x-rar-compressed") {
        return true;
    }
    return false;
}

// Note: Use decodeWidth and decodeHeight only when working with large photos and there are Out of Memory 
// exceptions issues. With NativeScript 3.x.x and above, image optimizations were implemented and in 
// the common scenarios, you should not worry about hitting OOM.
// Image "loadMode" property:
// newImage.loadMode = "async"; 
// l'immagine sarà caricata in modo asincrono, il che vuol dire che l'UI non si bloccherà durante le operazioni 
// di decodifica e preloading. La modalità è valida sia per iOS che Android.
// Se src comincia con http l'immagine a prescindere sarà caricata in modo asincrono.
// Abilita questa modalità solo se lavori anche con immagini locali
// newImage.useCache = "false"; Per bypassare il salvataggio dell'immagine nella cache e visualizzarla direttamente dall'URL.
function buildImage(container, gotData, isIcon = false) {
    const newImage = new Image();
    var url = gotData.fileurl;
    var stretch = "aspectFit";
    if (isIcon) {
        url = gotData.iconURL;
        stretch = "none";
        newImage.className = "page-icon";
        // newImage.verticalAlignment = "center";
    }
    newImage.src = url;
    newImage.id = "file";
    newImage.stretch = stretch;
    newImage.on(gestures.GestureTypes.longPress, () => {
        download(gotData);
    });
    container.addChild(newImage);
}

function buildPDF(container, src) {
    console.time('PDF');
    const pdf = new PDFView();
    pdf.flexGrow = 1;
    pdf.src = src;
    // pdf.id = "file";
    container.addChild(pdf);
    console.timeEnd('PDF');
}

function buildTextFile(container, fileurl, mimetype) {
    var response = displayFileContent(fileurl);
    response.then((data) => {   // qui arriva il file di testo salvato da displayFileContent nel percorso "/data/user/0/org.nativescript.MoodleApp/files/filename.html"
        if (mimetype == "text/plain") {
            initLabel(container, stripHtmlTags(data.readTextSync().toString()), "file", "left", true, 13, 10);
        } else {
            container.addChild(createFormattedString(data.readTextSync().toString()));
        }
    });
}

// metodo sperimentale che utilizza l'htmlview per mostrare sullo schermo il testo pre-formattato con grassetto, diversi font size e così via.
function createFormattedString(string) {
    const myText = new HtmlView();
    myText.html = string;
    myText.id = "file";
    myText.effectivePaddingLeft = 10;
    myText.effectivePaddingRight = 10;
    myText.effectivePaddingTop = 5;
    return myText;
}

function buildVideo(container, gotData) {
    const videoPlayer = new Video();
    videoPlayer.controls = true;
    videoPlayer.loop = false;
    videoPlayer.autoplay = false;
    videoPlayer.height = 280;
    videoPlayer.src = gotData.fileurl;
    videoPlayer.id = "file";
    videoPlayer.on(Video.pausedEvent, () => {
        console.log("video has been paused");
    });
    videoPlayer.on(Video.mutedEvent, () => {
        console.log("video has been muted");
    });
    container.addChild(videoPlayer);

    // const myGridLayout = new GridLayout();  // aggiungi 3 bottoni (PLAY - STOP - PAUSE)
    // myGridLayout.id = "my-grid-layout";
    // myGridLayout.row = 1;
    // myGridLayout.col = 3;
    // const firstButton = new Button();
    // const secondButton = new Button();
    // const thirdButton = new Button();
    // firstButton.text = "First button";
    // secondButton.text = "Second button";
    // thirdButton.text = "Third button";
    // myGridLayout.addChildAtCell(firstButton, 0, 0, 1, 1);
    // myGridLayout.addChildAtCell(secondButton, 0, 1);
    // myGridLayout.addChildAtCell(thirdButton, 0, 2);
    // container.addChild(myGridLayout);
}

// buildPageResource - questo metodo costruisce il layout per gli oggetti "page" e "book", mostrandone il contenuto
// spacchetta il contenuto della pagina/book e chiama ogni volta buildItemPage per costruire l'elemento singolo (immagine, testo, video,...)
// function buildPageResource(container, gotData) { 
//     // console.time('page');
//     var first = 0;
//     if (gotData.filetype == "book") {
//         first = 1;
//     }
//     // scorri content e costruisci oggetti
//     for (let i = first; i < gotData.pageContent.length; i++) {
//         // costruisci item e passalo a buildItemPage con uno stacklayout
//         var mimetype;
//         if (gotData.pageContent[i].mimetype) {
//             mimetype = gotData.pageContent[i].mimetype;
//         }
//         else {  // gestisci caso di file.html dove nel JSON non viene specificato il mimetype, rendili file di testo 
//             mimetype = "text/html";
//         }
//         let item = {
//             filename: gotData.pageContent[i].filename,
//             fileurl: gotData.pageContent[i].fileurl + "?forcedownload=1&token=" + localStorage.getItem("utente").token, // concatena il token di sessione dell'utente -> ok
//             filetype: mimetype
//         };
//         buildItemPage(container, item);
//     }
//     // console.timeEnd('page');
// }

// costruisci layout di pagina item-page in base alla risorsa che è stata richiesta
// la function analizza la singola risorsa che riceve in input e la mostra 

function buildItemPage(container, gotData) {
    // console.time('item');
    if (isDownloadable(gotData.filetype)) {  // abilita bottone di salvataggio per le immagini e pdf
        const page = container.page;
        const button = page.getViewById("settings-button");
        button.visibility = "visible";
        fileToSave = [];
        fileToSave = gotData;
    }

    // IF TEXT/PLAIN
    if (gotData.filetype == "text/plain" || gotData.filetype == "text/html") {
        buildTextFile(container, gotData.fileurl, gotData.filetype);
    }
    // IF PDF
    else if (gotData.filetype == "application/pdf") {
        buildPDF(gridcontainer, gotData.fileurl);
    }
    // IF VIDEO
    else if (gotData.filetype.includes("video")) {
        buildVideo(container, gotData);
    }
    // IF IMAGE
    else if (gotData.filetype.includes("image")) {
        buildImage(container, gotData);
    }
    else if (gotData.filetype == "scorm" || gotData.filetype == "book" || gotData.filetype == "page") {
        var myWebView = new webViewModule();
        myWebView.src = gotData.fileurl;
        container.addChild(myWebView);
        // buildVideo(container, gotData);  // avevo provato a visualizzare così i pacchetti SCORM
    }
    else if (isNotViewable(gotData.filetype)) { // archivi zip, rar e jar, file word, ppt,
        // buildImage(container, gotData, true);   // if longpress -> downloadù
        var img = new Image();
        img.src = "data:image/png;base64,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eN1MBCq6+Fu6HQTqPhHIevW02D/l0Y0n7Ftmadi33bMuXi/h6qdsxd/S6SCwino+72mZin1rsCPcs27T5dga1g8c6J518Xpp70pgKXkWT9nz93QWthrZCIxxz7pNh2BrXJOwyEhdzSI8HFtPeE22Y/Cfl1COe+ay5+/Bui/g9f4pd8bawCY6WaSaYvxAnuiedYdOwN7I1WT4mkPEyPrl54uEOQRZa2Df9qhJmFwkUhXTsU/++Yp71l16P/YB4AVgmnfiIolchb0m5rhn3aUG4Xtla4PvQLcCUn4HEpbwstTCGkpWCydiHwCawHneiYtEdiv2OviYe9ZGDeC/sDd8B3C0c+4isXwQew08TQke/g3nYOyXPk3Cxw9/4py7iNUU4Dns5/+53onH9Hni3AqsAyY75y7SrQbwn9jP+2cp+ezJicDjxBkE7gX28E1fpCvWJb9acaZ34iksIE5nNIGVaBCQvB1H+K7Feq4/AuzmnHsyXyfeIHAvuh2QPM0mrHAV4zx/r3PuSe0OPEy8QWAdejAoeTkU+F/inN83OefuYibwEvEGgQ3oFaHkYTbxir8P2Nc3fT+nEm8AaBLmCZxHyWZJSaUcR7zL/iYlnPTTqWuJOwg0CdOG9e2AeGoQnvbHeODXimXU4MdsImm2m3qB8BVh5TtQCjeFOO/5XxtPEnYNroXJhAd5sQeBJmFw0aIiksoHiTPD77WxnbBhaK1Mx769+EjxLeq5xqCkcSBxPuwZLs5wbEdWDsK+mvBI0U9YbbiOS45LHNMJ3/PH+K5luLjKryl5mg1sId0g0IpVwEcp+dxqcXMIYRkv60o+I8WthA12a+9I4HnSDwJNwiubGwi7Etd1a3IZ3lTC0t0xFrcdLe5B598uDiLtM4Hh4hXgLsJ2TfPQAambHsJefRcTHh5bN+1oN34GvNGhfaUznXRvB9qJfuBRwvvYS4BFhI+ZDiPsyLonYRckvWrMX4NwrPYC9ic8ZV9IeHd/HWGL7pSX9yMVf21e93VjL8LlUVGDgEKRKu5Bv/xtmUhYBrnoA6ZQxIpb0S1mx04l7gdECkURcSV62t+1mcT9lFih8Irt1HiST0y7E3dREYUidTxJDaf3praAeGsMKhSpYhl60p/MRMJqw6mmZioU3UYf4Xt+vSZ2cDBxNh9RKGLETVR4JZ9cNQibkcbYi1Ch6CYeoWILeJZRAziBOFuTKxTtxLOEdfsrs3R3FTSA44H7KP4EUVQzniZs16WvSjP3NuAy0q43oKhPrCE84CvlRp11Np6wjNNtwE6KP5EU5YkXCVPS56An+5WwN2Hh0GWEVzZFn2CK/GIjcD1wIvq1r7RxhIVILgBuxn8tAkUesYFwdbgYOAIYg9TWXsBc4DTgUsLCoisI3yI8A2wmbEZS9EmraC+2A5uApwj38LcD1xAG/eMJazzo0l5EREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREpCT+D36qBjsYTj0kAAAAAElFTkSuQmCC"
        img.className = "not-viewable";
        img.height = 200;
        img.width = 200;

        var label = new Label();
        label.text = "Il contenuto non è visibile. Ma puoi sempre scaricarlo!";
        label.textAlignment = "center";
        label.textWrap = "true";
        label.fontSize = 20;

        container.addChild(img);
        container.addChild(label);
    }
    else {
        initLabel(container, "Altro", "file-content-text");
    }
    // console.timeEnd('item');
}

function onNavigatingTo(args) {
    // console.time('onnav');
    const page = args.object;
    // Prima di costruire il layout di pagina verifica se non è stato già fatto prima durante la navigazione.
    // Quando eravamo in item e navigavamo verso una qualsiasi altra pagina, quando tornavamo indietro lui duplicava il contenuto di item
    // già costruito prima. Per risolvere il problema ho associato un id alla risorsa creata, sia essa un'immagine, video o altro, così
    // da poterla individuare. Nel caso in cui esista, non costruisco il layout di pagina.

    const file = page.getViewById("file");
    if (file) {
        // resource already exists
        return;
    }

    if (page.navigationContext) {
        const container = page.getViewById("file-content");
        gridcontainer = page.getViewById("grid-content");
        gotData = page.navigationContext;
        page.bindingContext = new ItemViewModel(gotData.filename, "Item");
        buildItemPage(container, gotData);
        // if (gotData.filetype == "page") {   // || gotData.filetype == "book"
        //     buildPageResource(container, gotData);
        // }
        // else if (gotData.filetype == "scorm") {
        //     var getScormByCourses = "mod_scorm_get_scorms_by_courses&courseids[0]=" + gotData.courseid;
        //     var response = WebServiceModule(getScormByCourses);
        //     response.then((data) => {
        //         scormdata = {
        //             filename: data['scorms'][0].name,
        //             filetype: "scorm",
        //             fileurl: data['scorms'][0].packageurl + "?forcedownload=1&token=" + localStorage.getItem("utente").token,
        //             iconURL: gotData.iconURL
        //         };
        //         buildItemPage(container, scormdata);
        //     });
        // }
        // else {
        //     buildItemPage(container, gotData);
        // }
    }
    else {
        console.log("Errore, corso non disponibile. Missing navigationContext");
    }
    // console.timeEnd('onnav');
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
exports.saveFile = saveFile;

// TO-DO:
/*
 * 3- IMPORTANTE: Dopo che scarico un pdf, si apre la pagina internet, il file viene scaricato. Quando torno sull'app mi esce una schermata bianca
 * e devo per forza ricaricare la pagina, perchè? Succede anche nella backward navigation.
 * Risolto solo per la backward navigation, togliendo pdf.id = file;
 * 5- Aggiungere 3 bottoni nella pagina del video Play Pause Stop per facilitare i comandi utente. https://docs.nativescript.org/api-reference/classes/_ui_layouts_grid_layout_.gridlayout#addchildatcell
*/