myApp.onPageInit('source', function (page) {
	localData = {
		source: globalData.load_source,
        readonly: vue_panel.selectedPlant.Readonly == true
	};
    new Vue({
        el: page.container.children[0],
		data: localData
    });
    vue = new Vue({
        el: page.container.children[1],
		data: localData
    });
});