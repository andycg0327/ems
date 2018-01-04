myApp.onPageInit('source', function (page) {
    vue = new Vue({
        el: page.container.children[1],
		data: {
            source: globalData.load_source || null,
            readonly: panelData.selectedPlant.Readonly == true
        },
		methods: {
			resetData: function() {
                this.source = globalData.load_source;
			},
		},
        beforeMount: function () {
            if(!globalData.load_source)
                ajaxSource(this);
        }
    });
    new Vue({
        el: page.container.children[0],
		data: vue._data
    });
});

function ajaxSource(vueInstance) {
    $.ajax({
        method: 'POST',
        url: serverUrl + '/plant_ajax/ajaxSource/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
        dataType: "json",
        data: {PlantOID: localStorage.PlantOID, loginToken: localStorage.loginToken},
        retryCount: 3,
        beforeSend : function() {
            setTimeout(function() { myApp.showIndicator(); });
        },
        success : function(response) {
            globalData.load_source = response;
            _.forEach(globalData.load_source, function(element) {
                element.Readonly = element.UserOID == null || panelData.selectedPlant.Readonly == 1;
            });
            vueInstance.resetData();
        },
        error : function(xhr, textStatus, errorThrown ) {
            notification = myApp.addNotification({
                title: '錯誤',
                message: '連線失敗，重新嘗試中..(' + this.retryCount + ')',
                hold: 5000,
                closeOnClick: true
            });
            if (this.retryCount--)
                $.ajax(this);
        },
        complete : function() {
            myApp.hideIndicator();
        }
    });
}