myApp.onPageInit('report_form', function (page) {
	localData = {
        readonly: !page.query.OID ? false : Cycle.Readonly
	};
    new Vue({
        el: page.container.children[0],
		data: localData,
        methods: {
            submit: function() {
                var data = $('[data-page="report_form"].page .page-content form').serializeArray();
                data.push({name: 'PlantOID', value: localStorage.PlantOID});
                data.push({name: 'loginToken', value: localStorage.loginToken});
                $.ajax({
                    method: 'POST',
                    url: serverUrl + '/plant_ajax/form_report/',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    dataType: "html",
                    data: data,
                    retryCount: 3,
                    beforeSend : function() {
                        setTimeout(function() { myApp.showIndicator(); });
                    },
                    success : function(response) {
                        notification = myApp.addNotification({
                            title: '訊息',
                            message: '已回報並通知管理員，謝謝。',
                            hold: 5000,
                            closeOnClick: true
                        });
                        mainView.router.back({
                            url: 'report.html',
                            force: true
                        });
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
        }
    });
    
    $('[data-page="report_form"].page [name="Info"]').css({
        height: $('[data-page="report_form"].page .page-content').height()
    });
});