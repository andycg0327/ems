myApp.onPageInit('chart', function (page) {
    var plotCustomized;
    
    vue = new Vue({
        el: page.container.children[1],
		data: {
            cycle: null,
            cycle_data: null,
            cycle_data_hourly: null,
            chartLoadData: [
                {label: "增重", key: 'WeightGain', unit: "g", data: [], bars: { show: true, barWidth: 60 * 60 * 1000, lineWidth: 1, fillColor: { colors: [{opacity: 0.8}, {opacity: 0.1}] }, align: "right" }, color: "#169eee", interpolate: 'right', float: 2}, 
                {label: "標準重", key: 'WeightStd', unit: "g", data: [], lines: { show: true, lineWidth: 7, steps: false }, points: { show: true, radius: 5 }, color: 89, interpolate: true, float: 2}, 
                {label: "毛雞重", key: 'Weight', unit: "g", data: [], lines: { show: true, lineWidth: 3 }, points: { show: true, radius: 3 }, color: 92, interpolate: true, float: 2}, 
                {label: "秤重隻數", key: 'WeightAmount', unit: "隻", data: [], lines: { show: true, lineWidth: 7 }, points: { show: true, radius: 5 }, color: 88, interpolate: true, float: 0}, 
                {label: "吃料量", key: 'Fodder', unit: "kg", data: [], lines: { show: true, lineWidth: 7 }, points: { show: true, radius: 5 }, color: 93, interpolate: true, float: 0}, 
                {label: "飲水量", key: 'Water', unit: "l", data: [], lines: { show: true, lineWidth: 7 }, points: { show: true, radius: 5 }, color: 94, interpolate: true, float: 0}, 
                {label: "換肉率", key: 'FCR', unit: "", data: [], lines: { show: true, lineWidth: 7 }, points: { show: true, radius: 5 }, color: 95, interpolate: true, float: 2}],
            sensor: null,
            selectedCycleOID: globalData.load_cycle.length > 0 ? globalData.load_cycle[0].OID : null,
            selectedCycle: globalData.load_cycle.length > 0 ? globalData.load_cycle[0] : {StartDate: null, EndDate: null, DailyConclude: '00:00:00'},
            selectedDate: globalData.load_cycle.length > 0 ? [globalData.load_cycle[0].StartDate, globalData.load_cycle[0].EndDate] : [],
            periodMode: 'D',
            parameters: ["增重", "標準重", "毛雞重"]
        },
		methods: {
			resetData: function() {
                var self = this;
				this.cycle = globalData.load_cycle;
				this.cycle_data = globalData.load_cycle_data;
				this.cycle_data_hourly = globalData.load_cycle_data_hourly;
				this.sensor = globalData.sensor;
                if(globalData.load_cycle_data.length > 0)
                    setTimeout(function() { self.prepareDraw(); });
			},
			calendarDateInit: function(e) {
                var self = this;
                calendarPicker = myApp.calendar({
                    input: '[data-page="chart"].page [name="selectedDate"]',
                    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月' , '九月' , '十月', '十一月', '十二月'],
                    dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
                    dateFormat: 'yyyy-mm-dd',
                    // direction: 'vertical',
                    firstDay: 0,
                    rangePicker: true,
                    // value: [this.selectedCycle.StartDate, moment.min(moment(), moment(this.selectedCycle.EndDate)).format('YYYY-MM-DD')],
                    value: globalData.load_cycle.length > 0 ? [this.selectedCycle.StartDate, moment(this.selectedCycle.EndDate).format('YYYY-MM-DD')] : [],
                    // minDate: moment(this.selectedCycle.StartDate).toDate(),
                    // maxDate: moment.min(moment(), moment(this.selectedCycle.EndDate)).toDate(),
                    // maxDate: moment(this.selectedCycle.EndDate).toDate(),
                    onChange: function(p, values, displayValues) {
                        self.selectedDate = values;
                    },
                    toolbarCloseText: '確定',
                    toolbarTemplate: '<div class="toolbar"><div class="toolbar-inner">{{monthPicker}}<button class="button button-round active" style="overflow:visible" onclick="vue.calendarDateResetValue()"><i class="fa fa-arrows-alt" aria-hidden="true"></i></button>{{yearPicker}}</div></div> '
                });
			},
			calendarDateOpen: function(e) {
                e.stopImmediatePropagation();
				calendarPicker.open();
			},
			calendarDateResetValue: function(e) {
                if(globalData.load_cycle.length > 0)
                    calendarPicker.setValue([this.selectedCycle.StartDate, this.selectedCycle.EndDate]);
			},
			prepareDraw: function() {
                var param = _.filter(this.parameters, function(o) { return !isNaN(o); });
                if(param.length > 0) {
                    var self = this;
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/ajaxSensorData/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                        dataType: "json",
                        data: {ChannelOID: JSON.stringify(param), Start: this.selectedCycle.StartDate, End: this.selectedCycle.EndDate, loginToken: localStorage.loginToken},
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            $.each(response, function(index, item) {
                                if(globalData.sensorData[item.ChannelOID] == null)
                                    globalData.sensorData[item.ChannelOID] = [];
                                var d = globalData.sensorData[item.ChannelOID];
                                if(d.length == 0 || moment(item.UnixTime).isAfter(d[d.length - 1][0]))
                                    d.push([moment(item.UnixTime), item.Value]);
                            });
                            self.drawChart();
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
                    this.drawChart();
			},
            drawChart: function(redraw = true) {
                var self = this;
                var data = [], yaxes = [], stdLineObj = [];
                // var rangeMin = moment((groupIndex != null ? this.selectedCycle.StartDate : (this.selectedDate || this.selectedCycle.StartDate)) + " " + this.selectedCycle.DailyConclude);
                // var rangeMax = groupIndex != null || this.selectedDate == null ? moment(this.selectedCycle.EndDate + " " + this.selectedCycle.DailyConclude) : moment(rangeMin).add(1, 'days');
                var rangeMin = globalData.load_cycle.length > 0 ? moment(moment(this.selectedDate[0]).format('YYYY-MM-DD') + " " + this.selectedCycle.DailyConclude) : moment();
                var rangeMax = moment.min(this.selectedDate.length == 2 ? moment(moment(this.selectedDate[1]).format('YYYY-MM-DD') + " " + this.selectedCycle.DailyConclude) : moment(rangeMin).add(1, 'days'), moment().add(23, 'hours'));
                
                // ----- 飼養參數類 -----
                // var data = _.cloneDeep(this.chartLoadData);
                // 依序查找飼養參數
                $.each(this.chartLoadData, function(index, el){
                    if(self.parameters.indexOf(el.label) != -1) {
                        data.push(_.cloneDeep(el));
                        // 設定Y軸
                        if(!(el.label == '毛雞重' && self.parameters.indexOf('標準重') != -1))
                            yaxes.push({position: yaxes.length % 2 ? "left" : "right"});
                        data[index].yaxis = yaxes.length;
                        // 設定增重柱狀圖寬度
                        if(el.label == '增重' && self.periodMode == 'D')
                            data[0].bars.barWidth *= 24;
                        else if(el.label == '增重' && self.periodMode == 'M')
                            data[0].bars.barWidth /= 6;
                    } else
                        data.push({});
                });
                
                // 依序疊代 load_cycle_data
                $.each(globalData.load_cycle_data, function(i, item) {
                    var timestamp = moment(item.ConcludeEnd);
                    // 依序查找飼養參數
                    $.each(data, function(index, el){
                        // 飼養參數有勾選 && (日平均 或 非日平均但為['標準重', '吃料量', '飲水量', '換肉率'])
                        if(self.parameters.indexOf(el.label) != -1 && (self.periodMode == 'D' || (self.periodMode != 'D' && ['標準重', '吃料量', '飲水量', '換肉率'].indexOf(el.label) != -1))) {
                            // cycle_data 在時間範圍內
                            if(timestamp.isBetween(rangeMin, rangeMax, null, el.label == '增重' ? '(]' : '[]'))
                                el.data.push([timestamp, Math.max(0, parseFloat(item[el.key] || 0))]);
                        }
                    });
                });
                // 依序疊代 load_cycle_data_hourly
                $.each(globalData.load_cycle_data_hourly, function(i, item) {
                    var timestamp = moment(item.DateTime);
                    // 小時制&為整點 || 分鐘制
                    if((self.periodMode == 'H' && timestamp.minute() == 0) || self.periodMode == 'M') {
                        // 依序查找飼養參數
                        $.each(data, function(index, el){
                            // 飼養參數有勾選 && 非日平均 && 不為['標準重', '吃料量', '飲水量', '換肉率']
                            if(self.parameters.indexOf(el.label) != -1 && self.periodMode != 'D' && ['標準重', '吃料量', '飲水量', '換肉率'].indexOf(el.label) == -1) {
                                // cycle_data 在時間範圍內
                                if(timestamp.isBetween(rangeMin, rangeMax, null, el.label == '增重' ? '(]' : '[]'))
                                    el.data.push([timestamp, Math.max(0, parseFloat(item[el.key] || 0))]);
                            }
                        });
                    }
                });
                
                // ----- Sensor類 -----
                var axisMax = -9999, parameter = "";
                $.each(_.orderBy(this.sensor, ['Max'], ['asc']), function(index, item) {
                    // 勾選此sensor
                    if(self.parameters.indexOf(item.ChannelOID) != -1) {
                        var digital = item.Max == 1;
                        // Y軸設定值: Max由小至大排序，同樣數值者同Y軸
                        if(item.Max != axisMax) {
                            yaxes.push({show: !digital, position: yaxes.length % 2 ? "left" : "right", min: item.Min, max: item.Max});
                            axisMax = item.Max;
                        }
                    
                        data.push({
                            label: '[' + item.InterfaceTitle + '] ' + item.Parameter, 
                            unit: item.Unit, 
                            data: _.filter(globalData.sensorData[item.ChannelOID], function(o) { return moment(o[0]).isBetween(rangeMin, rangeMax, null, '[]'); }), 
                            lines: { show: !digital, lineWidth: 5, color: "opacity:0.6" }, 
                            points: { show: digital, radius: 3 }, 
                            color: index, 
                            yaxis: yaxes.length, 
                            interpolate: !digital, 
                            float: 2, 
                            digitalTitle: item.DigitalFalse && item.DigitalTrue ? [item.DigitalFalse, item.DigitalTrue] : null
                        });
                        // 標準線
                        if(item.Standard != null && item.Parameter != parameter) {
                            stdLineObj.push({ x: 0, y: item.Standard, yaxis: yaxes.length - 1, label: item.Parameter, direction: 'h'});
                            parameter = item.Parameter;
                        } else if(item.Parameter == "溫度" && self.selectedDate.length == 1) {
                            $.each(globalData.load_cycle_data, function(index, itemData) {
                                if(itemData.Date == self.selectedDate) {
                                    stdLineObj.push({ x: 0, y: itemData.TemperatureStd, yaxis: yaxes.length - 1, label: item.Parameter + "(" + itemData.TemperatureStd + " " + item.Unit + ")", direction: 'h'});
                                }
                            });
                        }
                    } else
                        data.push({});
                });
                
                // 繪製曲線圖
                if(!plotCustomized || redraw) {
                    plotCustomized = $.plot("#chartCustomized", data, {
                        series: { shadowSize: 0 },
                        crosshair: { mode: "x", lock: true },
                        xaxis: { mode: "time", timezone: "browser", monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月' , '九月' , '十月', '十一月', '十二月'] },
                        yaxes: yaxes,
                        grid: { borderWidth: 1, hoverable: true, clickable: true, markings: function (axes){
                            var markings = [];
                            for (var x = Math.floor(axes.xaxis.min) + 604800000; x < axes.xaxis.max; x += 604800000)
                                markings.push({ color: "#000", lineWidth: 1, xaxis: { from: x, to: x } });
                            return markings;
                        } },
                        legend: { position: "nw", backgroundOpacity: 0, showTitle: true, titleFormat: self.periodMode == 'D' ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm:ss", showValue: true },
                        tooltip: {
                            show: true,
                            contents: function(item) {
                                var x = item.datapoint[0].toFixed(2), y = parseFloat(item.datapoint[1].toFixed(2)), xValue = moment(parseFloat(x)).tz(moment.tz.guess());
                                // 全週期
                                if(self.periodMode == 'D' && item.seriesIndex <= 7)
                                    return "日齡 " + moment(xValue).diff(self.selectedCycle.StartDate, 'days') + "<br />" + (xValue.isValid() ? moment(xValue).subtract(1, 'day').format("YYYY-MM-DD HH:mm") + ' ~ ' + moment.min(xValue, moment(moment().format("YYYY-MM-DD HH:00"))).subtract(1, 'seconds').format("YYYY-MM-DD HH:mm") : x) + "<br />" + item.series.label + " = " + (item.series.interpolate === true || item.series.digitalTitle == null ? y.toFixed(item.series.float) : item.series.digitalTitle[y]) + item.series.unit;
                                else
                                    return (xValue.isValid() ? xValue.format("YYYY-MM-DD HH:mm:ss") : x) + "<br />" + item.series.label + " = " + (item.series.interpolate === true || item.series.digitalTitle == null ? y.toFixed(item.series.float) : item.series.digitalTitle[y]) + item.series.unit;
                            }
                        },
                        overlays: stdLineObj,
                        selection: {
                            mode: "x",
                            reload: self.selectedDate == null
                        }
                    });
                    // new Hammer(document.getElementById('chartCustomized'), { domEvents: true });
                } else {
                    plotCustomized.setData(data);
                    plotCustomized.draw();
                }
            }
		},
        beforeMount: function () {
            this.calendarDateInit();
            // 沒下載過sensor時，下載供參數選擇列表顯示
            if(!globalData.sensor)
                ajaxSensor(this);
            else
                this.resetData();
        },
        watch: {
            selectedCycleOID: function (newCycleOID) {
                var self = this;
                var newCycle = _.find(this.cycle, {OID: newCycleOID});
                this.selectedCycle = newCycle;
                // 換週期後日曆需重置
                calendarPicker.destroy();
                this.calendarDateInit();
                // cycle_data 沒有此週期資料的時候下載
                if(_.some(globalData.load_cycle_data, function(item) {
                        return moment(item.Date).isBetween(newCycle.StartDate, newCycle.EndDate, null, '[]') && moment(item.Date + ' ' + newCycle.DailyConclude).isBefore(moment())
                    }) == false) {
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/ajaxLoadCycleData/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                        dataType: "json",
                        data: {PlantOID: localStorage.PlantOID, CycleOID: newCycle.OID, loginToken: localStorage.loginToken},
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            globalData.load_cycle_data = globalData.load_cycle_data.concat(response);
                            // 下載 cycle_data_hourly
                            $.ajax({
                                method: 'POST',
                                url: serverUrl + '/plant_ajax/ajaxLoadCycleDataHourly/',
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                                dataType: "json",
                                data: {PlantOID: localStorage.PlantOID, CycleOID: newCycle.OID, loginToken: localStorage.loginToken},
                                retryCount: 3,
                                beforeSend : function() {
                                    setTimeout(function() { myApp.showIndicator(); });
                                },
                                success : function(response) {
                                    if(!globalData.load_cycle_data_hourly)
                                        globalData.load_cycle_data_hourly = [];
                                    globalData.load_cycle_data_hourly = globalData.load_cycle_data_hourly.concat(response);
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
            // 更換日期範圍
            selectedDate: function () {
                this.drawChart();
            },
            // 調整檢視時距
            periodMode: function (newParam, oldParam) {
                // 下載 cycle_data_hourly
                if(!globalData.load_cycle_data_hourly) {
                    var self = this;
                    $.ajax({
                        method: 'POST',
                        url: serverUrl + '/plant_ajax/ajaxLoadCycleDataHourly/',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                        dataType: "json",
                        data: {PlantOID: localStorage.PlantOID, CycleOID: this.selectedCycle.OID, loginToken: localStorage.loginToken},
                        retryCount: 3,
                        beforeSend : function() {
                            setTimeout(function() { myApp.showIndicator(); });
                        },
                        success : function(response) {
                            if(!globalData.load_cycle_data_hourly)
                                globalData.load_cycle_data_hourly = [];
                            globalData.load_cycle_data_hourly = globalData.load_cycle_data_hourly.concat(response);
                            self.drawChart(newParam == 'D' || oldParam == 'D');
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
                    this.drawChart(newParam == 'D' || oldParam == 'D');
            },
            // 調整顯示參數
            parameters: function () {
                var self = this;
                $('.popup.smart-select-popup').off('popup:close').on('popup:close', function () {
                    globalData.sensorData = globalData.sensorData || {};
                    self.prepareDraw();
                });
            }
        }
    });
    new Vue({
        el: page.container.children[0],
		data: vue._data,
        methods: {
            refresh: function() {
                ajaxSensor(vue);
            }
        }
    });
    
    mc = new Hammer(document.getElementById('chartCustomized'), { domEvents: true }), zoom = 1;
    mc.get('pinch').set({ enable: true });
    $( "#chartCustomized" ).on({
        pinch: function(ev) {
            plotCustomized.zoom({
                amount: ev.originalEvent.gesture.scale / zoom,
                center: { left: ev.originalEvent.gesture.center.x, top: ev.originalEvent.gesture.center.y }
            });
            zoom = ev.originalEvent.gesture.scale;
        }, 
        pinchend: function(ev) {
            zoom = 1;
        }
    });
});
    
