myApp.onPageInit('result', function (page) {
    Template7.global.data.length = 0;
    var tempData = [];
    // 篩選日期
    if(Template7.global.query_calendar.length > 0) {
        $.each(Template7.global.fullData, function(index, item) {
            if(moment(item.StartDate).isBetween(Template7.global.query_calendar[0], Template7.global.query_calendar[1], null, '[]') && 
            (!Template7.global.query_endDate || (Template7.global.query_endDate && moment(item.EndDate).isBetween(Template7.global.query_calendar[0], Template7.global.query_calendar[1], null, '[]'))) )
                tempData.push(item);
        });
    } else
        tempData = Template7.global.fullData.slice(0); // Clone array
    
    // 篩選分析方法
    if(Template7.global.query_method != -1) {
        var sum = 0, count = 0, avg = 0, std = 0, max = 0, min = 0;
        // var x = "AvgDays", y = "FodderRatio";
        var y = Template7.global.query_column;
        $.each(tempData, function(index, item) {
            if(item[y]) {
                sum += parseFloat(item[y]);
                count++;
            }
        });
        avg = sum / count;
        $.each(tempData, function(index, item) {
            if(item[y])
                std += Math.pow(parseFloat(item[y]) - avg, 2);
        });
        std = Math.sqrt(std / count);
        max = avg + (Template7.global.query_method == 1 ? std : 2 * std);
        min = avg - (Template7.global.query_method == 1 ? std : 2 * std);
        $.each(tempData, function(index, item) {
            if(item[y] && (parseFloat(item[y]) <= min || max <= parseFloat(item[y])))
                Template7.global.data.push(item);
        });
    } else
        Template7.global.data = tempData;
    
    // 表格排序
    Template7.global.data.sort(function(a, b){
        var valueA = a[Template7.global.table_sort_column], valueB = b[Template7.global.table_sort_column];
        
        return Template7.global.table_sort == 'ASC' ? valueA - valueB : valueB - valueA;
    });
    
    var myList = myApp.virtualList('.list-block.virtual-list', {
        items: Template7.global.data,
        // Custom render function to render item's HTML
        renderItem: function (index, item) {
            var str = "";
            $.each(Template7.global.table_column, function(key, value) {
                if(value) {
                    /* str +=  
                                  '<tr>' + 
                                    '<th class="label-cell">' + Template7.global.table_column_alias[key] + '</th>' + 
                                    '<td class="numeric-cell">' + (moment.isMoment(item[key]) ? item[key].format("YYYY-MM-DD") : item[key]) + '</td>' + 
                                  '</tr>'; */
                    /* str += '<li class="item-content">' + 
                               '<div class="item-inner">' +
                                   '<div class="item-title">' + Template7.global.table_column_alias[key] + '</div>' +
                                   '<div class="item-after">' + (moment.isMoment(item[key]) ? item[key].format("YYYY-MM-DD") : item[key]) + '</div>' +
                               '</div>' + 
                           '</li>'; */
                    str += 
                               '<div class="item-inner">' + 
                                   '<div class="item-after">' + (moment.isMoment(item[key]) ? item[key].format("YYYY-MM-DD") : item[key]) + '</div>' +
                               '</div>';
                }
            });
            /* return '<li class="item-content">' + '<div class="data-table" style="width:100%">' + 
                              '<table>' + 
                                '<tbody>' + str + 
                                '</tbody>' + 
                              '</table>' + 
                            '</div>' + '</li>'; */
            /* return '<li class="item-content">' + 
                       '<div class="item-inner">' + '<ul style="width:100%">' + str + '</ul>' + '</div>' + 
                   '</li>'; */
            return '<li class="item-content">' + 
                       '<div class="item-inner" style="padding:0">' + str + '</div>' + 
                   '</li>';
        },
        searchByItem: function (query, index, item) {
            var bool = false;
            $.each(Template7.global.table_column, function(key, value) {
                if(value && item[key]) {
                    bool =  bool || (moment.isMoment(item[key]) ? item[key].format("YYYY-MM-DD") : item[key]).indexOf(query.trim()) >= 0;
                }
            });
            return bool;
        }
    });
    
    $$('#tab2').on('tab:show', function () {
        var data = {}, array = [];
        $.each(Template7.global.data, function(index, item) {
            if(Template7.global.chart_dot_type[item.Type]) {
                if(!data[item.Type])
                    data[item.Type] = 0;
                data[item.Type]++;
            }
        });
        $.each(data, function(index, value) {
            array.push({
                data: [[index, value]]
            });
        });
        
        chart_bar = $.plot("#chart_bar", array, {
            series: {
                shadowSize: 0,
                bars: {
                    show: true,
                    fillColor: { colors: [{opacity: 0.8}, {opacity: 0.1}] },
                    barWidth: 0.6,
                    align: "center"
                },
                valueLabels: {
                    show: true
                }
            },
			grid: {
				borderWidth: {
                    top: 0,
                    left: 2,
                    bottom: 2,
                    right: 0
                }
			},
            xaxis: { mode: "categories", tickLength: 0 },
            legend: { position: "nw", backgroundOpacity: 0 }
        });
    });
    
    $$('#tab3').on('tab:show', function () {
        var data = {}, array = [];
        $.each(Template7.global.data, function(index, item) {
            if(!data[item.StartDate.format("YYYY")])
                data[item.StartDate.format("YYYY")] = 0;
            data[item.StartDate.format("YYYY")]++;
        });
        $.each(data, function(index, value) {
            array.push([index, value]);
        });
        
        chart_area = $.plot("#chart_area", [array], {
            series: {
                shadowSize: 0,
                bars: {
                    show: true,
                    fillColor: { colors: [{opacity: 0.8}, {opacity: 0.1}] },
                    barWidth: 0.6,
                    align: "center"
                },
                valueLabels: {
                    show: true
                }
            },
			grid: {
				borderWidth: {
                    top: 0,
                    left: 2,
                    bottom: 2,
                    right: 0
                }
			},
            xaxis: { mode: "categories", tickLength: 0 },
            legend: { position: "nw", backgroundOpacity: 0 },
        });
    });
    
    var chart_dot, mc;
    $(".tab-link[href='#tab4']").click(function() {
        if(chart_dot) {
            $.each(chart_dot.getAxes(), function(_, axis) {
                var opts = axis.options;
                opts.min = null;
                opts.max = null;
            });
        
            chart_dot.setupGrid();
            chart_dot.draw();
        }
    });
    $$('#tab4').on('tab:show', function () {
        var data = {}, array = [];
        var x = Template7.global.chart_dot_x, y = Template7.global.chart_dot_y, xAxisTime = false, yAxisTime = false;
        $.each(Template7.global.data, function(index, item) {
            if(Template7.global.chart_dot_type[item.Type]) {
                if(!data[item.Type])
                    data[item.Type] = [];
                if(item[x] && item[y])
                    data[item.Type].push([item[x], item[y]]);
                
                xAxisTime = xAxisTime || moment.isMoment(item[x]);
                yAxisTime = yAxisTime || moment.isMoment(item[y]);
            }
        });
        $.each(data, function(index, value) {
            array.push({
                label: index,
                data: value
            });
        });
        
        chart_dot = $.plot("#chart_dot", array, {
            series: {
                shadowSize: 0,
                points: {
                    show: true,
                    radius: 2
                }
            },
			grid: {
				hoverable: true,
				clickable: true
			},
            xaxis: { mode: xAxisTime ? "time" : null, timezone: "browser" },
            yaxis: { mode: yAxisTime ? "time" : null, timezone: "browser" },
            legend: { position: "nw", backgroundOpacity: 0 },
        });
        
        // Hammer 多點觸控縮放
        if(!mc) {
            mc = new Hammer(document.getElementById('chart_dot'), { domEvents: true }), zoom = 1;
            mc.get('pinch').set({ enable: true });
            $( "#chart_dot" ).on({
                pinch: function(ev) {
                    chart_dot.zoom({
                        amount: ev.originalEvent.gesture.scale / zoom,
                        center: { left: ev.originalEvent.gesture.center.x, top: ev.originalEvent.gesture.center.y }
                    });
                    zoom = ev.originalEvent.gesture.scale;
                }, 
                pinchend: function(ev) {
                    zoom = 1;
                }
            });
            
            // 節點小視窗
            $("<div id='tooltip'></div>").css({ position: "absolute", display: "none", 'z-index': 9999, border: "1px solid #fdd", padding: "2px", "background-color": "#fee", opacity: 0.8, 'pointer-events': 'none' }).appendTo("#tab4");
            
            $("#chart_dot").bind("plotclick", function (event, pos, item) {
              if(item) {
                var x = item.datapoint[0], y = item.datapoint[1];
                $("#tooltip").html(
                "[X]" + Template7.global.table_column_alias[Template7.global.chart_dot_x] + ": " + (item.series.xaxis.options.mode == "time" ? moment(x).format("YYYY-MM-DD") : x) + "<br />" + 
                "[Y]" + Template7.global.table_column_alias[Template7.global.chart_dot_y] + ": " + (item.series.yaxis.options.mode == "time" ? moment(y).format("YYYY-MM-DD") : y)).css({top: item.pageY + 5, left: item.pageX + 5}).show();
                
                // tooltip視窗位置與滑鼠位置左右相反
                if(pos.x > (item.series.xaxis.max + item.series.xaxis.min) / 2)
                  $("#tooltip").css({right: window.innerWidth - item.pageX + 5, left: ''});
                else
                  $("#tooltip").css({left: item.pageX + 5, right: ''});
              
                // tooltip視窗位置與滑鼠位置上下相反
                if(pos.y > (item.series.yaxis.max + item.series.yaxis.min) / 2)
                  $("#tooltip").css({top: item.pageY, bottom: ''});
                else
                  $("#tooltip").css({bottom: window.innerHeight - item.pageY, top: ''});
              } else
                $("#tooltip").hide();
            });

        }
    }).on('tab:hide', function () {
        // $( "#chart_dot" ).off("pinch");
        // $( "#chart_dot" ).off("pinchend");
        // $( "#chart_dot" ).off("plotclick");
        $("#tooltip").hide();
    });
    
    myApp.hideIndicator();
});

myApp.onPageBeforeAnimation('result', function (page) {
    $('#search_bar').css({
        'top': $(".navbar").height()
    });
    $('#title_bar').css({
        'top': $(".navbar").height() + $(".searchbar").height()
    });
    $('#data_list').css({
        'margin-top': $(".searchbar").height() + $("#title_bar").height()
    });
});