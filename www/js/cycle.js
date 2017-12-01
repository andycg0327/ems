myApp.onPageInit('cycle', function (page) {
	localData = {
		cycle: globalData.load_cycle,
		source: globalData.load_source,
        readonly: vue_panel.selectedPlant.Readonly == true,
        allowAdd: !(globalData.load_cycle.length >= 1 && moment(globalData.load_cycle[0].EndDate).isAfter(moment()))
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