myApp.onPageInit('sensor', function (page) {
	localData = {
		sensor: null,
		sensor_water: null,
		sensor_fodder: null
	};
    vue = new Vue({
        el: page.container.children[1],
		data: localData,
		methods: {
			resetData: function() {
				localData.sensor = globalData.sensor;
				localData.sensor_water = globalData.sensor_water;
				localData.sensor_fodder = globalData.sensor_fodder;
			},
		},
        beforeMount: function () {
            ajaxSensor(this);
        }
    });
});

ajaxSensor= function(vueInstance) {
    $.ajax({
        method: 'POST',
        url: serverUrl + '/plant_ajax/ajaxSensor/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
        dataType: "json",
        data: {PlantOID: localStorage.PlantOID, loginToken: localStorage.loginToken},
        retryCount: 3,
        beforeSend : function() {
            setTimeout(function() { myApp.showIndicator(); 
            notification = myApp.addNotification({
                title: '錯誤',
                message: '123..(',
                hold: 5000,
                closeOnClick: true
            });});
        },
        success : function(response) {
            $.each(response, function(key, value){
                globalData[key.toString()] = value;
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