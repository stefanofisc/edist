const observableModule = require("tns-core-modules/data/observable");

const SelectedPageService = require("../selected-page-service");


function ErrorViewModel(info) {
    SelectedPageService.getInstance().updateSelectedPage("Error");

    const viewModel = observableModule.fromObject({
        title: "Errore",
        errorMessage: info.errorMessage
    });

    return viewModel;
}

module.exports = ErrorViewModel;
