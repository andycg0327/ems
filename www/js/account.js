myApp.onPageInit('account', function (page) {
	localData = {
        account: panelData.account,
        newPassword: null
	};
    new Vue({
        el: page.container.children[0],
		data: localData,
        methods: {
            submit: function() {
                if(formValidate($(page.container).find('form'))) {
                    var data = $('[data-page="account"].page .page-content form').serializeArray();
                    data.push({name: 'loginToken', value: localStorage.loginToken});
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/form_account/',
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
                                message: '已修改完成。',
                                hold: 5000,
                                closeOnClick: true
                            });
                            mainView.router.back();
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
        }
    });
    vue = new Vue({
        el: page.container.children[1],
		data: localData
    });
});