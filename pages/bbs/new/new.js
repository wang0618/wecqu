var app = getApp();
Page({
    data: {
        accounts: ["校园环境", "学生生活", "后勤服务", "食堂意见"],
        accountIndex: 0,
        private: ["公开发表", "匿名发表", "非公开"],
        privateIndex: 0,
        version: '',
        showLog: false
    },

    onLoad: function () {
    },
    bindAccountChange: function (e) {
        this.setData({
            accountIndex: e.detail.value
        })
    },
    bindPrivateChange: function (e) {
        this.setData({
            privateIndex: e.detail.value
        })
    },
    submit: function (e) {
        console.log(e.detail.value);
        if (!e.detail.value.title)
            return app.showErrorModal('请输入标题！', '错误');
        if (!e.detail.value.content)
            return app.showErrorModal('请输入内容！', '错误');

        wx.showLoading({
            title: '提交中',
            mask: true
        });
        wx.request({
            url: app._server + app.api.bbs_do_post,
            method: 'POST',
            data: app.key({
                'post_type': e.detail.value.post_type,
                'private_status': e.detail.value.private_status,
                'content': e.detail.value.content,
                'title': e.detail.value.title,
                'user_nick':app.cache.wx_info.nickName,
                'head_img':app.cache.wx_info.avatarUrl,
            }),
            success: function (res) {
                wx.hideLoading();
                if (res.data.status != 200)
                    return app.showErrorModal(res.data.message, '提交失败');
                wx.showToast({
                    title: '提交成功',
                    icon: 'success',
                    duration: 2000
                });
                setTimeout(function () {
                    wx.redirectTo({
                        url: '../post_detail/detail?id='+res.data.data
                    });
                },1000);
            },
            fail: function () {
                wx.hideLoading();
                app.showErrorModal('网络异常', '提交失败');
            }
        });
    }
});