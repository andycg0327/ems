myApp.onPageInit('plant_switch', function (page) {
	localData = {
		plant_list: globalData.plant_list
	};
    vue = new Vue({
        el: page.container.children[1],
		data: localData,
        methods: {
            plantSwitch: function(plantOID) {
                localStorage.PlantOID = parseInt(plantOID);
                globalData.sensor = null;
                globalData.sensor_data = null;
                vue_panel.resetData();
                ajaxData('main.html', true);
                // mainView.router.load({
                    // url: 'index.html',
                    // reload: true
                // });
            }
        }
    });
    // panelData = {
        // account: null,
        // plant_list: null,
        // selectedPlant: null
    // };
    // vue_panel = new Vue({
        // el: '.panel',
        // data: panelData,
        // methods: {
            // resetData: function() {
                // panelData.account = globalData.account ? globalData.account : null;
                // panelData.plant_list = globalData.plant_list ? globalData.plant_list : null;
                // panelData.selectedPlant = globalData.plant_list ? _.find(globalData.plant_list, {PlantOID: localStorage.PlantOID}) : null;
            // },
            // logout: function() {
                // localStorage.removeItem("loginToken");
                // myApp.closePanel();
                // setTimeout(function() {
                    // mainView.router.load({
                        // url: 'index.html',
                        // reload: true
                    // });
                // });
            // }
        // }
    // });
});