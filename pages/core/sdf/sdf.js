//sdf.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        userName: '',
        renderData: {},
        show_bind_card_btn:false
    },

    onLoad: function () {
        var _this = this;
        //判断并读取缓存
        if (app.cache.ele_fee) {
            sdfRender(app.cache.ele_fee);
        }

        function sdfRender(info) {
            _this.setData({
                'renderData': info,
                remind: ''
            });
        }

        wx.showNavigationBarLoading();
        // 发送请求
        wx.request({
            url: app._server + app.api.get_elefee,
            method: 'POST',
            data: app.key({}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var info = res.data.data;
                    if (info) {
                        if (!app.cache.ele_fee) {
                            //用户返回主页时重新渲染电费信息
                            app.index_show_callback.push(['render_ele', function (that) {
                                that.eleFeeRender(app.cache.ele_fee);
                            }]);
                        }
                        //保存电费缓存
                        app.saveCache('ele_fee', info);
                        sdfRender(info);
                    } else {
                        _this.setData({remind: '暂无数据'});
                    }
                } else {
                    if (res.data.code == 1) {
                        return _this.setData({
                            remind: '未完善寝室信息'
                        });
                    }else if(res.data.code==401){
                        return _this.setData({
                            remind: '未绑定一卡通账号，无法查询电费',
                            show_bind_card_btn:true
                        });
                    }

                    if (!app.cache.ele_fee) {
                        _this.setData({
                            remind: res.data.message || '网络错误'
                        });
                    } else {
                        app.toast(_this, '更新电费信息失败')
                    }

                }
            },
            fail: function (res) {
                if (!app.cache.ele_fee) {
                    _this.setData({
                        remind: res.data.message || '网络错误'
                    });
                } else {
                    app.toast(_this, '更新电费信息失败')
                }
            },
            complete: function () {
                wx.hideNavigationBarLoading();
            }
        });
    }
});