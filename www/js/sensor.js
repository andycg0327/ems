myApp.onPageInit('sensor', function (page) {
    vue = new Vue({
        el: page.container.children[1],
		data: {
            now: moment(),
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
            var self = this;
            ajaxSensor(this);
            setInterval(function() { self.now = moment(); }, 1000);
        }
    });
});

ajaxSensor= function(vueInstance) {
    $.ajax({
        method: 'POST',
        url: serverUrl + '/plant_ajax/ajaxSensor/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
        dataType: "json",
        data: {PlantOID: localStorage.PlantOID},
        retryCount: 3,
        success : function(response) {
            $.each(response, function(key, value){
                globalData[key.toString()] = value;
                $.each(globalData[key.toString()], function(index, item){
                    item.LastUpdate = moment(item.LastUpdate);
                });
            });
            vueInstance.resetData();
        }
    });
}