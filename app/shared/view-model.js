const observableModule = require("tns-core-modules/data/observable");

const SelectedPageService = require("./selected-page-service");

function PagesViewModel(title, selectedPage, myItems) {
    SelectedPageService.getInstance().updateSelectedPage(selectedPage);

    myItems = myItems || {};

    const viewModel = observableModule.fromObject({
        title: title,
        dataItems: myItems
    });

    return viewModel;
}

module.exports = PagesViewModel;
