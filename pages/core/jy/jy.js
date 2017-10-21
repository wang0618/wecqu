//jy.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        jyData: {
            book_list: [],  //当前借阅列表
            books_num: 0,   //当前借阅量
            nothing: true   //当前是否有借阅
        },
        other: {
            outdate: '*',     //超期借阅
            arrearage: '*'        //欠费
        },
        show_toast: false,
        toast_msg: ''
    },
    bind_status: 0, //0 未知,1 已绑定,2 未绑定
    onLoad: function () {
        this.getData();
    },
    onPullDownRefresh: function () {
        this.getData();
    },
    getData: function () {
        var _this = this;
        //判断并读取缓存
        if (app.cache.library) {
            jyListRender(app.cache.library);
        }
        if (app.cache.library_otherinfo) {
            _this.setData({
                other: app.cache.library_otherinfo
            });
        }

        function jyListRender(info) {
            info.nothing = !parseInt(info.books_num) || !info.book_list || !info.book_list.length;
            var colors = ['green', 'yellow', 'red', 'purple'],
                nowTime = new Date().getTime();
            if (!info.nothing) {
                info.book_list.map(function (e) {
                    var jDate = e.jsrq.split('-'), hDate = e.yhrq.split('-'),
                        jTime = new Date(jDate[0], jDate[1] - 1, jDate[2]).getTime(),
                        hTime = new Date(hDate[0], hDate[1] - 1, hDate[2]).getTime();
                    var sum = parseInt((hTime - jTime) / 1000 / 60 / 60 / 24),
                        timing = parseInt((hTime - nowTime) / 1000 / 60 / 60 / 24),
                        k = 1 - timing / sum, n = 0;
                    if (k < 0.3) {
                        n = 0;
                    }
                    else if (k < 0.7) {
                        n = 1;
                    }
                    else if (k <= 1) {
                        n = 2;
                    }
                    else if (k > 1) {
                        n = 3;
                    }
                    e.color = colors[n];
                    return e;
                });
            }
            _this.setData({
                jyData: info,
                remind: ''
            });
        }

        wx.showNavigationBarLoading();
        var current_request = 2;
        wx.request({
            url: app._server + app.api.get_library_info,
            method: 'POST',
            data: app.key({other_info: true}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var info = res.data.data;
                    if (info) {
                        app.saveCache('library_otherinfo', info);
                        _this.setData({
                            other: app.cache.library_otherinfo
                        });
                        _this.bind_status = 1;
                    }
                } else {
                    if (res.data.code == 1) { //未绑定
                        _this.bind_status = 2;
                    }
                    _this.toast(res.data.message);
                }
            },
            fail: function (res) {
                _this.toast('网络错误，获取超期和欠费信息失败')
            },
            complete: function () {
                wx.stopPullDownRefresh();
                current_request--;
                if (current_request == 0)
                    wx.hideNavigationBarLoading();
            }
        });
        wx.request({
            url: app._server + app.api.get_library_info,
            method: 'POST',
            data: app.key({}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var info = res.data.data;
                    if (info) {
                        if (!app.cache.library) {
                            //用户返回主页时重新渲染借阅信息
                            app.index_show_callback.push(['render_library', function (that) {
                                that.libraryRender(app.cache.library);
                            }]);
                        }
                        //保存借阅缓存
                        app.saveCache('library', info);
                        jyListRender(info);
                    }
                } else {
                    _this.toast('获取借阅信息失败');
                }
            },
            fail: function (res) {
                if (!app.cache.library) {
                    _this.setData({
                        remind: '网络错误'
                    });
                } else {
                    _this.toast('更新借阅信息失败');
                }
            },
            complete: function () {
                wx.stopPullDownRefresh();
                current_request--;
                if (current_request == 0)
                    wx.hideNavigationBarLoading();
            }
        });
    },
    jyHistory: function () {
        this.toast('暂不能查看超期图书详情哦~')
    },
    continue_borrow: function (e) {
        var _this = this;
        if (_this.bind_status == 2) {
            wx.showModal({
                title: '未绑定图书馆账号',
                content: '您未绑定图书馆账号，无法续借图书，是否前去绑定？',
                showCancel: true,
                success: function (res) {
                    if (res.confirm) {
                        wx.redirectTo({
                            url: "/pages/more/append"
                        });
                    }
                }
            });
            return;
        }

        wx.showLoading({
            title: '加载中',
            mask: true
        });
        wx.request({
            url: app._server + app.api.get_library_info,
            method: 'POST',
            data: app.key({
                reborrow: true,
                book_id: e.currentTarget.id
            }),
            success: function (res) {
                wx.hideLoading();
                if (res.data && res.data.status === 200) {
                    app.showErrorModal(res.data.data, '续借结果');
                    _this.getData();
                    //用户返回主页时重新获取借阅信息
                    app.index_show_callback.push(['library', function (that) {
                        that.user_auth_callback(true, '', {library: true, card: false, elefee: false});
                    }]);
                } else {
                    _this.toast('服务器错误，续借图书失败');
                }
            },
            fail: function (res) {
                wx.hideLoading();
                _this.toast('网络错误，续借图书失败');
            }
        });
    },
    toast: function (msg) {
        var _this = this;
        _this.setData({
            show_toast: true,
            toast_msg: msg
        });
        setTimeout(function () {
            _this.setData({
                show_toast: false
            });
        }, 2000);
    }

});