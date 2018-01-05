myApp.onPageInit('cycle_edit', function (page) {
    var Cycle = _.find(globalData.load_cycle, {OID: parseInt(page.query.OID)});
	localData = {
		cycle: page.query.OID ? Cycle : null,
		source: globalData.load_source,
        readonly: !page.query.OID ? false : Cycle.Readonly
	};
    new Vue({
        el: page.container.children[0],
		data: localData,
        methods: {
            submit: function() {
                if(formValidate($(page.container).find('form'))) {
                    var data = $('[data-page="cycle_edit"].page .page-content form').serializeArray();
                    data.push({name: 'PlantOID', value: localStorage.PlantOID});
                    data.push({name: 'loginToken', value: localStorage.loginToken});
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/form_cycle/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        dataType: "html",
                        data: data,
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            ajaxData('cycle.html', true);
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
		data: localData,
        mounted: function () {
            calendarPicker = myApp.calendar({
                input: '[data-page="cycle_edit"].page .page-content [name="StartDate"]',
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月' , '九月' , '十月', '十一月', '十二月'],
                dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
                dateFormat: 'yyyy-mm-dd',
                // direction: 'vertical',
                firstDay: 0,
                closeOnSelect: true,
                value: page.query.OID ? [this.cycle.StartDate] : null,
                minDate: !page.query.OID && globalData.load_cycle.length == 0 || page.query.OID && globalData.load_cycle.length == 1 ? null : moment(globalData.load_cycle[page.query.OID && globalData.load_cycle.length >= 2 ? 1 : 0].EndDate).add(1, 'days').toDate(),
                toolbarCloseText: '確定'
            });
        }
    });
});