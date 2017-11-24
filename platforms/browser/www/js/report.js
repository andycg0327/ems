myApp.onPageInit('report', function (page) {
	localData = {
		report: globalData.report
	};
    vue = new Vue({
        el: page.container.children[1],
		data: localData,
		methods: {
			resetData: function() {
				localData.report = globalData.report;
			},
            ajaxReportData: function() {
                var self = this;
                $.ajax({
                    method: 'POST',
                    url: serverUrl + '/plant_ajax/ajaxReportData/',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                    dataType: "json",
                    data: {loginToken: localStorage.loginToken},
                    retryCount: 3,
                    beforeSend : function() {
                        setTimeout(function() { myApp.showIndicator(); });
                    },
                    success : function(response) {
                        globalData.report = response;
                        self.resetData();
                    },
                    error : function(xhr, textStatus, errorThrown ) {
                        myApp.addNotification({
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
		},
        beforeMount: function () {
            this.ajaxReportData();
        },
        mounted: function () {
        }
    });
});