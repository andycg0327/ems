myApp.onPageInit('password', function (page) {
    $("#submit").click(function() {
        if($("#NewPassword").val() == "") {
            myApp.addNotification({
                title: '修改密碼',
                message: '新密碼不能為空白。',
                button: {
                    text: 'OK'
                }
            });
        } else if($("#NewPassword").val() != $("#ConfirmPassword").val()) {
            myApp.addNotification({
                title: '修改密碼',
                message: '新密碼與確認密碼不符。',
                button: {
                    text: 'OK'
                }
            });
        } else {
            $$.post('http://shhtest.shh.tw/plant_bim/ajaxChangePassword', {OldPassword: $("#OldPassword").val(), NewPassword: $("#NewPassword").val(), Token: Template7.global.token}, 
            function (data) {
                myApp.addNotification({
                    title: '修改密碼',
                    message: data,
                    button: {
                        text: 'OK'
                    }
                });
            }, function () {
                myApp.addNotification({
                    title: '修改密碼',
                    message: '修改密碼失敗。',
                    button: {
                        text: 'OK'
                    }
                });
            });
        }
    });
})