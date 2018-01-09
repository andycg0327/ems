var serverUrl = "http://shhtest.shh.tw";
var globalData = {}, localData, vue_panel, vue, calendarPicker, notification, formChanged;
var h = $(window).height();
var panelData = {
    account: null,
    plant_list: null,
    selectedPlant: null
};
moment.tz.setDefault("Asia/Taipei");
moment.locale('zh-tw');

// 判斷平台並修改樣式
if (Framework7.prototype.device.android) {
    $('<link rel="stylesheet" href="lib/framework7/css/framework7.material.min.css">' + '<link rel="stylesheet" href="lib/framework7/css/framework7.material.colors.min.css">').prependTo('head');
} else {
    $('.pages.navbar-fixed').removeClass('navbar-fixed').addClass('navbar-through');
    $('.page .navbar').prependTo('.view');
    $('<link rel="stylesheet" href="lib/framework7/css/framework7.ios.min.css">' + '<link rel="stylesheet" href="lib/framework7/css/framework7.ios.colors.min.css">').prependTo('head');
}

// Initialize app
var myApp = new Framework7({
    // init: false, //Disable App's automatic initialization
    material: Framework7.prototype.device.android,
    swipeBackPage: false,
    // swipePanel: 'left',
    // swipePanelActiveArea: 20,
    smartSelectOpenIn:'popup',
    smartSelectBackText: '返回',
    onPageAfterAnimation: function (app, page) {
        formChanged = false;
        $(page.container).find('form input, form select, form textarea').change(function() {
            formChanged = true;
        });
        $(page.container).find('.back').removeClass('back').click(function() {
            backFormCheck();
        });
        
        // myApp.hideIndicator();
    },
    onAjaxStart: function (xhr) {
        myApp.showIndicator();
    },
    onAjaxComplete: function (xhr) {
        myApp.hideIndicator();
    }
});

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    // dynamicNavbar: true
});

myApp.onPageInit('index', function (page) {
    if(!vue_panel) {
        vue_panel = new Vue({
            el: '.panel',
            data: panelData,
            methods: {
                resetData: function() {
                    panelData.account = globalData.account ? globalData.account : null;
                    panelData.plant_list = globalData.plant_list ? globalData.plant_list : null;
                    panelData.selectedPlant = globalData.plant_list ? _.find(globalData.plant_list, {PlantOID: localStorage.PlantOID}) : null;
                },
                logout: function() {
                    localStorage.removeItem("loginToken");
                    myApp.closePanel(false);
                    mainView.router.back({
                        url: 'index.html',
                        reload: true
                    });
                    // this.$destroy();
                }
            }
        });
    }

    vue = new Vue({
        el: '[data-page="index"].page .page-content',
		data: { logged: localStorage.getItem('loginToken') != null }
    });

    $('.form-to-data').on('click', function(){
        $.ajax({
            method: 'POST',
            url: serverUrl + '/plant_ajax/',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            dataType: "json",
            data: {loginToken: btoa($('[data-page="index"].page [name="Account"]').val() + ":" + $('[data-page="index"].page [name="Password"]').val())},
            retryCount: 3,
            beforeSend : function() {
                setTimeout(function() { myApp.showPreloader('登入中..'); });
            },
            success : function(response) {
                if(response.loginToken == "False") {
                    notification = myApp.addNotification({
                        title: '錯誤',
                        message: '登入失敗。請檢查帳號密碼是否正確。',
                        hold: 3000,
                        closeOnClick: true
                    });
                } else if(response.loginToken == "Over") {
                    notification = myApp.addNotification({
                        title: '錯誤',
                        message: '登入失敗。<br/>您的網路IP位置已於30分內嘗試超過10次。',
                        hold: 3000,
                        closeOnClick: true
                    });
                } else {
                    localStorage.loginToken = response.loginToken;
                    globalData.account = response.account;
                    globalData.plant_list = response.plant_list;
                    localStorage.PlantOID = localStorage.PlantOID && _.find(globalData.plant_list, {PlantOID: localStorage.PlantOID}) ? localStorage.PlantOID : globalData.plant_list[0].PlantOID;
                    vue_panel.resetData();
                    ajaxData('main.html');
                }
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
                myApp.hidePreloader();
            }
        });
    });
}).trigger();

myApp.onPageAfterAnimation('index', function (page) {
    setTimeout(function() {
        // $('#logo').height(window.outerHeight / 3);
        $("body").css({visibility: 'initial'});
        // $('[data-page="index"].page .page-content').css({'padding-top': ($('[data-page="index"].page .page-content').height() - $('[data-page="index"].page .page-content .login-screen-title').height() - $('[data-page="index"].page .page-content form').height()) / 2});
        // $('#logo').height($('[data-page="index"].page').height() / 3);
        // setTimeout(function() { $('#logo').height($('[data-page="index"].page .page-content').height() / 3); });

        setTimeout(function() {
            if(localStorage.loginToken) {
                $.ajax({
                    method: 'POST',
                    url: serverUrl + '/plant_ajax/',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    dataType: "json",
                    data: {loginToken: localStorage.loginToken},
                    retryCount: 3,
                    beforeSend : function() {
                        setTimeout(function() { myApp.showPreloader('登入中..'); });
                    },
                    success : function(response) {
                        if(response.loginToken == "False")
                            localStorage.removeItem("loginToken");
                        else if(response.loginToken == localStorage.loginToken) {
                            globalData.account = response.account;
                            globalData.plant_list = response.plant_list;
                            localStorage.PlantOID = localStorage.PlantOID && _.find(globalData.plant_list, {PlantOID: localStorage.PlantOID}) ? localStorage.PlantOID : globalData.plant_list[0].PlantOID;
                            vue_panel.resetData();
                            ajaxData('main.html');
                        }
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
                        myApp.hidePreloader();
                    }
                });
            }
        }, 1000);
    });
}).trigger();

function ajaxData(url, back = false) {
    notification = myApp.addNotification({
        title: '訊息',
        message: '資料同步中，請稍後..',
        closeIcon: false,
        button: {}
    });

    $.ajax({
        method: 'POST',
        url: serverUrl + '/plant_ajax/ajaxData/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        dataType: "json",
        data: {PlantOID: localStorage.PlantOID, loginToken: localStorage.loginToken},
        retryCount: 3,
        beforeSend : function() {
            setTimeout(function() { myApp.showIndicator(); });
        },
        success : function(response) {
            myApp.closeNotification(notification);
            $.each(response, function(key, value){
                globalData[key.toString()] = value;
            });
            _.forEach(globalData.load_cycle, function(element) {
                element.Readonly = moment(element.EndDate).add(10, 'days').isBefore(moment()) || panelData.selectedPlant.Readonly == 1;
            });
            if(!back)
                mainView.router.load({
                    url: url,
                    reload: true
                });
            else
                mainView.router.back({
                    url: url,
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

function formValidate(formElement) {
    var valid = true;
    _.forEachRight(formElement.find('[required]'), function(el) {
        if(el.value == "") {
            valid = false
            el.focus();
            if(Framework7.prototype.device.android)
                $(el).parent().addClass('required');
            else
                $(el).parent().parent().addClass('required');
        } else {
            if(Framework7.prototype.device.android)
                $(el).parent().removeClass('required');
            else
                $(el).parent().parent().removeClass('required');
        }
    })
    _.forEachRight(formElement.find('[validate]'), function(el) {
        if(el.value != $('[name="' + $(el).prop('validate') + '"]').val()) {
            valid = false
            el.focus();
            if(Framework7.prototype.device.android)
                $(el).parent().addClass('required');
            else
                $(el).parent().parent().addClass('required');
        } else {
            if(Framework7.prototype.device.android)
                $(el).parent().removeClass('required');
            else
                $(el).parent().parent().removeClass('required');
        }
    })
    if(!valid) {
        notification = myApp.addNotification({
            title: '訊息',
            message: '有欄位尚未完成正確填寫',
            hold: 5000,
            closeIcon: false,
            closeOnClick: true
        });
    }
    return valid;
}

function backFormCheck() {
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
}

// Handle Cordova Device Ready Event
$(document).on('deviceready', function() {
    // Push notification
    var push = PushNotification.init({
        "android": {
            forceShow: true
        },
        "browser": {
            pushServiceURL: 'http://push.api.phonegap.com/v1/push'
        },
        "ios": {
            alert: true,
            badge: true,
            sound: false
        },
        "windows": {}
    });
    push.on('registration', function(data) {
        alert('aaa');
        alert('registration event: ' + data.registrationId);
        alert('aaa');
        notification = myApp.addNotification({
            title: '訊息',
            message: 'registration event: ' + data.registrationId,
            hold: 5000,
            closeIcon: false,
            closeOnClick: true
        });
        alert('registration event: ' + data.registrationId);

        var oldRegId = localStorage.getItem('registrationId');
        if (oldRegId !== data.registrationId) {
            // Save new registration ID
            localStorage.setItem('registrationId', data.registrationId);
            // Post registrationId to your app server as the value has changed
        }
    });
    push.on('notification', (data) => {
        alert('notification');
        alert(data.message);
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
    });
    push.on('error', (e) => {
        alert('error');
        alert(e.message);
        // e.message
    });
    
    // Android 返回鍵
    document.addEventListener("backbutton", function() {
        if ($('body').hasClass('with-panel-left-cover'))    // Panel
            myApp.closePanel();
        else if (calendarPicker && calendarPicker.opened) // 日曆
            calendarPicker.close();
        else if ($('.modal-in').length > 0)    // Modal
            myApp.closeModal();
        else if(mainView.activePage.name == 'main') { // 已在首頁
            myApp.modal({
                title: '訊息',
                text: '確定結束應用程式嗎？',
                buttons: [{
                    text: '取消'
                },{
                    text: '確定',
                    onClick: function () {
                        navigator.app.exitApp();;
                    }
                }]
            });
        } else    // 上一頁
            backFormCheck();
    }, false);
});

// Android 虛擬鍵盤偏移
$(window).resize(function() {
    if($(":focus").length > 0 && $(":focus").offset().top > h - $(window).height())
        $(mainView.activePage.container).find('.page-content').scrollTop($(mainView.activePage.container).find('.page-content').scrollTop() + h - $(window).height());
});