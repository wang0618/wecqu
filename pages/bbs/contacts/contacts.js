var app = getApp();
Page({
    data: {
        all_posts: [],
        new_reply: []
    },
    onShow() {
        this.getContacts()
    },
    getContacts() {
        var _this = this;
        wx.showToast({
            title: '加载中',
            icon: 'loading'
        });
        wx.request({
            url: app._server + app.api.bbs_get_user_postslist,
            method: 'GET',
            data: app.key({}),
            success: function (res) {
                wx.hideToast();
                if (res.data.status != 200)
                    return app.showErrorModal('获取数据失败','错误');

                _this.setData({
                    all_posts: res.data.data.all,
                    new_reply: res.data.data.new
                })
            },
            fail: function () {
                wx.hideToast();
                app.showErrorModal('获取数据失败','错误');
            }
        });
    }
});