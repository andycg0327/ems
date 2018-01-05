myApp.onPageInit('sensor', function (page) {
    vue = new Vue({
        el: page.container.children[1],
		data: {
            load_device: null,
            sensor: null,
            sensor_water: null,
            sensor_fodder: null
        },
		methods: {
			resetData: function() {
				this.load_device = globalData.load_device;
				this.sensor = globalData.sensor;
				this.sensor_water = globalData.sensor_water;
				this.sensor_fodder = globalData.sensor_fodder;
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
            setTimeout(function() { myApp.showIndicator(); });
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