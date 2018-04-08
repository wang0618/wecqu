//ks.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        list: [],
        first: 1
    },
    togglePage: function (e) {
        var id = e.currentTarget.id, data = {};
        data.show = [];
        for (var i = 0, len = this.data.class.length; i < len; i++) {
            data.show[i] = false;
        }
        if (this.data.first) {
            this.setData(data);
            this.data.first = 0;
        }
        data.show[id] = !this.data.show[id];
        this.setData(data);
    },
    //分享
    onShareAppMessage: function () {
        var name = this.data.name || app.cache.user.name,
            id = this.data.id || app.cache.user.id;
        return {
            title: '我的考试安排',
            desc: 'We重大 - 考试安排',
            path: '/pages/index/index'
        };
    },
    //下拉更新
    onPullDownRefresh: function () {
        var _this = this;
        _this.loginHandler({
            id: _this.data.id || app.cache.user.id,
            name: _this.data.name || app.cache.user.name
        });
    },
    onLoad: function (options) {
        var _this = this;
        app.loginLoad(function () {
            _this.loginHandler.call(_this, options);
        }, function () {
            wx.showModal({
                title: '错误',
                content: '网络连接出错',
                showCancel: false
            });
        });
    },
    //让分享时自动登录
    loginHandler: function (options) {
        var _this = this;
        _this.setData({
            id: app.cache.user.id,
            name: app.cache.user.name
        });

        //判断并读取缓存
        if (app.cache.exam) {
            ksRender(app.cache.exam);
        }

        function ksRender(list) {
            if (!list || !list.length) {
                _this.setData({
                    remind: '无考试安排'
                });
                return false;
            }
            var days = ['一', '二', '三', '四', '五', '六', '日'];
            for (var i = 0, len = list.length; i < len; ++i) {
                list[i].open = false;
                list[i].index = i;
                //倒计时提醒
                try {
                    var nowTime = new Date().getTime();
                    var oDate = list[i].date.split('-'),
                        oTime = new Date(oDate[0], oDate[1] - 1, oDate[2]).getTime();
                    var temp = (oTime - nowTime) / 1000 / 60 / 60 / 24;
                    list[i].days = temp > 0 ? parseInt(temp + 1) : parseInt(temp);
                    if (list[i].days > 0) {
                        list[i].countdown = '还有' + list[i].days + '天考试';
                    } else if (list[i].days < 0) {
                        list[i].countdown = '考试已过了' + (-list[i].days) + '天';
                    } else {
                        list[i].countdown = '今天考试';
                    }
                } catch (e) {
                    list[i].countdown = '';
                }
            }
            list[0].open = true;
            _this.setData({
                list: list,
                remind: ''
            });
        }

        wx.showNavigationBarLoading();
        wx.request({
            url: app._server + app.api.get_exam_info,
            method: 'POST',
            data: app.key({}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var list = res.data.data;
                    if (list) {
                        if (!options.name) {
                            //保存考试缓存
                            app.saveCache('exam', list);
                        }
                        ksRender(list);
                    } else {
                        _this.setData({remind: '暂无数据'});
                    }

                } else {
                    if (res.data.code == 100) {
                        wx.showModal({
                            title: '加载数据失败',
                            content: res.data.message || "数据获取失败,您的教务处密码在绑定小程序后可能进行了更改,请尝试更新密码",
                            cancelText: '暂不更新',
                            confirmText: '更新密码',
                            success: function (res) {
                                if (res.confirm) {
                                    wx.redirectTo({
                                        url: '/pages/more/append'
                                    });
                                }
                            }
                        });
                    } else if (!app.cache.exam) {
                        _this.setData({
                            remind: res.data.message || '未知错误'
                        });
                    } else {
                        app.toast(_this, "更新数据失败");
                    }
                }
            },
            fail: function (res) {
                if (!app.cache.exam) {
                    _this.setData({
                        remind: res.data.message || '未知错误'
                    });
                } else {
                    app.toast(_this, "更新数据失败");
                }
            },
            complete: function () {
                wx.hideNavigationBarLoading();
                wx.stopPullDownRefresh();
            }
        });
    },
    // 展示考试详情
    slideDetail: function (e) {
        var id = e.currentTarget.dataset.id,
            list = this.data.list;
        // 每次点击都将当前open换为相反的状态并更新到视图，视图根据open的值来切换css
        for (var i = 0, len = list.length; i < len; ++i) {
            if (i == id) {
                list[i].open = !list[i].open;
            } else {
                list[i].open = false;
            }
        }
        this.setData({
            list: list
        });
    }
});
