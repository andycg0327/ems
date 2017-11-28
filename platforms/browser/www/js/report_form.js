myApp.onPageInit('report_form', function (page) {
    var formChanged = false;
    
	localData = {
        readonly: !page.query.OID ? false : Cycle.Readonly
	};
    new Vue({
        el: page.container.children[0],
		data: localData,
        methods: {
            back: function() {
                if(formChanged) {
                    myApp.modal({
                        title: '訊息',
                        text: '資料尚未儲存，確定離開？', 
                        buttons: [{
                            text: '取消'
                        },{
                            text: '確定',
                            onClick: function () {
                                mainView.router.back();
                            }
                        }]
                    });
                } else
                    mainView.router.back();
            },
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
        },
        mounted: function () {
            $(page.container).find('input, select, textarea').change(function() {
                formChanged = true;
            });
        }
    });
    
    $('[data-page="report_form"].page [name="Info"]').css({
        height: $('[data-page="report_form"].page .page-content').height()
    });
});