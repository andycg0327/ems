myApp.onPageInit('source_edit', function (page) {
    var formChanged = false;
    
    var Source = _.find(globalData.load_source, {OID: parseInt(page.query.SourceOID || globalData.load_source[0].OID)});
	localData = {
		source: Source,
		source_data: null,
		source_OID: page.query.SourceOID,
        readonly: !page.query.SourceOID ? false : Source.Readonly
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
                if(formValidate($(page.container).find('form'))) {
                    var data = $('[data-page="source_edit"].page .page-content form').serializeArray();
                    data.push({name: 'PlantOID', value: localStorage.PlantOID});
                    data.push({name: 'loginToken', value: localStorage.loginToken});
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/form_source/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        dataType: "html",
                        data: data,
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            ajaxData('source.html', true);
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
        el: page.container.children[2],
		data: localData,
		methods: {
			resetData: function() {
				localData.source_data = globalData.load_source_data;
			},
            ajaxSourceData: function() {
                if(_.some(globalData.load_source_data, {SourceOID: Source.OID}) == false) {
                    var self = this;
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/ajaxSourceData/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                        dataType: "json",
                        data: {SourceOID: Source.OID, loginToken: localStorage.loginToken},
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            globalData.load_source_data = response;
                            self.resetData();
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
                } else
                    this.resetData();
            }
		},
        beforeMount: function () {
            this.ajaxSourceData();
        },
        mounted: function () {
            $(page.container).find('input, select, textarea').change(function() {
                formChanged = true;
            });
        }
    });
});