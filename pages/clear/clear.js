var app = getApp();
Page({
    data: {
        version: '',
        showLog: false
    },
    onLoad: function () {
        wx.setNavigationBarTitle({title: '数据清除'});

        this.setData({
            version: app.version,
            year: new Date().getFullYear()
        });
    },
    clear: function (e) {
        var id = e.currentTarget.id;

        if (id == 'cache') {
            wx.clearStorageSync();
            app.cache = {
                wx_info: app.cache.wx_info,
                user: app.cache.user,
                session: app.cache.session,
                term: app.cache.term
            };

            //用户返回主页时重新获取授权信息
            app.index_show_callback.push(['authUser',function (that) {
                that.setData({
                    'card.kb.show':false,
                    'card.ykt.show':false,
                    'card.jy.show':false,
                    'card.sdf.show':false
                });
                app.authUser(function (status, error_msg) {
                    that.user_auth_callback.call(that, status, error_msg);
                }, function () {
                    if (app.cache.user)
                        that.toast('离线缓存模式'); //开启离线缓存模式
                    else
                        that.setData({'remind': '网络错误'});
                });
            }]);

            wx.showToast({
                title: '操作成功',
                icon: 'success',
                duration: 2000
            })
        } else {
            var messages = {
                dormitory: '清空寝室信息后，将无法查询电费；课表将不会显示上下课时间（无法确定作息时间）',
                card: '解绑一卡通账号后，将无法查询一卡通余额',
                library: '解绑图书馆账号后，将无法查询图书馆借阅情况以及续借图书',
                account: '删除账号后,您的所有数据将在服务器删除，再次使用本小程序需要重新绑定账号'
            };
            wx.showModal({
                title: '确定继续？',
                content: messages[id] + ', 是否继续？',
                showCancel: true,
                success: function (res) {
                    if (!res.confirm) {
                        return;
                    }
                    wx.request({
                        url: app._server + app.api.clear_data,
                        method: 'POST',
                        data: app.key({'type': id}),
                        success: function (res) {
                            if (res.data.status != 200)
                                return app.showErrorModal(res.data.message, '操作失败');
                            wx.showToast({
                                title: '操作成功',
                                icon: 'success',
                                duration: 2000
                            });
                            wx.clearStorageSync();
                            app.cache = {
                                wx_info: app.cache.wx_info,
                                user: app.cache.user,
                                session: app.cache.session,
                                term: app.cache.term
                            };

                            //用户返回主页时重新获取授权信息
                            app.index_show_callback.push(['authUser',function (that) {
                                that.setData({
                                    'card.kb.show':false,
                                    'card.ykt.show':false,
                                    'card.jy.show':false,
                                    'card.sdf.show':false
                                });
                                app.authUser(function (status, error_msg) {
                                    that.user_auth_callback.call(that, status, error_msg);
                                }, function () {
                                    if (app.cache.user)
                                        that.toast('离线缓存模式'); //开启离线缓存模式
                                    else
                                        that.setData({'remind': '网络错误'});
                                }, function () {
                                    that.setData({
                                        'user.is_bind': false,
                                        'remind': '未绑定'
                                    });
                                });
                            }]);
                        },
                        fail: function () {
                            app.showErrorModal('网络异常', '操作失败');
                        }
                    });
                }
            });
        }
    }
});