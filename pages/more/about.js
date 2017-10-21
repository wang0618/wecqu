//about.js
//获取应用实例
var app = getApp();
Page({
    data: {
        version: '',
        showLog: false
    },
    onLoad: function () {
        this.setData({
            version: app.version,
            year: new Date().getFullYear()
        });
        this.get_user_count();
    },
    toggleLog: function () {
        this.setData({
            showLog: !this.data.showLog
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
    }
});