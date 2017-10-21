//login.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        help_status: false,
        userid_focus: false,
        passwd_focus: false,
        userid: '',
        passwd: '',
        angle: 0
    },
    status: true,
    onShow:function () {
        // this.get_user_count();
    },
    onReady: function () {
        var _this = this;
        setTimeout(function () {
            _this.setData({
                remind: ''
            });
        }, 1000);
        wx.onAccelerometerChange(function (res) {
            var angle = -(res.x * 30).toFixed(1);
            if (angle > 14) {
                angle = 14;
            }
            else if (angle < -14) {
                angle = -14;
            }
            if (_this.data.angle !== angle) {
                _this.setData({
                    angle: angle
                });
            }
        });

        wx.getUserInfo({
            withCredentials: false,
            success: function (res) {
                //清除缓存
                app.cache = {};
                wx.clearStorage();

                app.saveCache('wx_info', res.userInfo);
            },
            fail: function () {
                app.showErrorModal('拒绝授权将导致无法关联学校帐号并影响使用，请重新打开小程序再点击允许授权！', '授权失败');
                _this.status = false;
            }
        });
    },
    get_user_count:function () {
        var this_ = this;
        wx.request({
            method: 'GET',
            url: app._server + '/api/usercount',
            data: {},
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    this_.setData({
                        user_count: res.data.data
                    });
                }
            }
        });
    },
    bind: function () {
        var _this = this;
        if (!_this.status) {
            app.showErrorModal('未授权，请重新打开小程序对小程序进行授权', '无法绑定');
            return;
        }
        if (!_this.data.userid || !_this.data.passwd) {
            app.showErrorModal('账号及密码不能为空', '提醒');
            return false;
        }
        app.showLoadToast('绑定中');

        wx.login({
            success: function (res) {
                wx.request({
                    method: 'POST',
                    url: app._server + '/api/user/new',
                    data: {
                        code: res.code,
                        stuid: _this.data.userid,
                        passwd: _this.data.passwd
                    },
                    success: function (res) {
                        if (res.data && res.data.status === 200) {
                            //app.showLoadToast('请稍候');
                            app.saveCache('user', res.data.data.user);
                            app.saveCache('term', res.data.data.term);
                            app.saveCache('session', res.data.data.session);

                            wx.showToast({
                                title: '绑定成功',
                                icon: 'success',
                                duration: 1500
                            });

                            setTimeout(function () {
                                wx.showModal({
                                    title: '提示',
                                    content: '部分功能需要完善信息才能正常使用，是否前往完善信息？',
                                    cancelText: '以后再说',
                                    confirmText: '完善信息',
                                    success: function (res) {
                                        //用户返回主页时重新向服务器请求数据
                                        app.index_show_callback.push(['user_auth_callback',function (that) {
                                            that.user_auth_callback.call(that, true);
                                        }]);

                                        if (res.confirm) {
                                            wx.redirectTo({
                                                url: 'append'
                                            });
                                        } else {
                                            wx.navigateBack();
                                        }
                                    }
                                });
                            }, 1500);
                        } else {
                            wx.hideToast();
                            app.showErrorModal(res.data.message, '绑定失败');
                        }
                    },
                    fail: function (res) {
                        wx.hideToast();
                        app.showErrorModal(res.errMsg, '绑定失败');
                    }
                });
            }
        });


    },
    useridInput: function (e) {
        this.setData({
            userid: e.detail.value
        });
        if (e.detail.value.length >= 8) {
            wx.hideKeyboard();
        }
    },
    passwdInput: function (e) {
        this.setData({
            passwd: e.detail.value
        });
    },
    inputFocus: function (e) {
        if (e.target.id == 'userid') {
            this.setData({
                'userid_focus': true
            });
        } else if (e.target.id == 'passwd') {
            this.setData({
                'passwd_focus': true
            });
        }
    },
    inputBlur: function (e) {
        if (e.target.id == 'userid') {
            this.setData({
                'userid_focus': false
            });
        } else if (e.target.id == 'passwd') {
            this.setData({
                'passwd_focus': false
            });
        }
    },
    tapHelp: function (e) {
        if (e.target.id == 'help') {
            this.hideHelp();
        }
    },
    showHelp: function (e) {
        this.setData({
            'help_status': true
        });
    },
    hideHelp: function (e) {
        this.setData({
            'help_status': false
        });
    },
    go_about:function (e) {
        wx.navigateTo({
            url: '/pages/more/about'
        })
    }
});