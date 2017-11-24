myApp.onPageInit('result_filter', function (page) {
    var query_calendar = myApp.calendar({
        input: '#query_calendar',
        value: Template7.global.query_calendar,
        //closeOnSelect: true,
        rangePicker: true,
        firstDay: 0,
        onChange: function(p, values, displayValues) {
            Template7.global.query_calendar = values;
        }
    });
    
    $("#query_calendar_clear").click(function() {
        query_calendar.setValue([]);
        // if(Template7.global.query_calendar) {
            // Template7.global.query_calendar.length = 0;
            // Template7.global.query_calendar = null;
        // }
    });
    
    $("select[name='query_method']").change(function() {
        Template7.global.query_method = $(this).val();
    });
    
    $("select[name='query_endDate']").change(function() {
        Template7.global.query_endDate = $(this).val() == 1;
    });
    
    $("select[name='table_column']").change(function() {
        var array = $(this).val();
        $.each(Template7.global.table_column, function(index, value) {
            Template7.global.table_column[index] = array.indexOf(index) !== -1;
        });
    });
    
    $("select[name='table_sort_column']").change(function() {
        Template7.global.table_sort_column = $(this).val();
    });
    
    $("select[name='table_sort']").change(function() {
        Template7.global.table_sort = $(this).val();
    });
    
    $("select[name='chart_dot_type']").change(function() {
        var array = $(this).val();
        $.each(Template7.global.chart_dot_type, function(index, value) {
            Template7.global.chart_dot_type[index] = array.indexOf(index) !== -1;
        });
    });
    
    $("select[name='chart_dot_x']").change(function() {
        Template7.global.chart_dot_x = $(this).val();
    });
    
    $("select[name='chart_dot_y']").change(function() {
        Template7.global.chart_dot_y = $(this).val();
    });
})