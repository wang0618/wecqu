var app = getApp();
Page({
    data: {
        version: '',
        showLog: false
    },
    onLoad: function () {
        wx.setNavigationBarTitle({title: '反馈'});

    },
    submit: function (e) {
        if(!e.detail.value.title)
            return app.showErrorModal('请输入反馈标题！','错误');
        if(!e.detail.value.content)
            return app.showErrorModal('请输入反馈内容！','错误');

        wx.showLoading({
            title:'提交中',
            mask:true
        });
        wx.request({
            url: app._server + app.api.feedback,
            method: 'POST',
            data: app.key({
                'content': e.detail.value.content,
                'title': e.detail.value.title,
                'contact':e.detail.value.contact
            }),
            success: function (res) {
                wx.hideLoading();
                if (res.data.status != 200)
                    return app.showErrorModal(res.data.message, '反馈失败');
                wx.showToast({
                    title: '反馈成功',
                    icon: 'success',
                    duration: 2000
                });
            },
            fail: function () {
                wx.hideLoading();
                app.showErrorModal('网络异常', '反馈失败');
            }
        });
    }
});