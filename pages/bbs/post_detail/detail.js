var app = getApp();
var is_requestion = false;
var id;
Page({
    data: {
        display: 'none',
        author_mode: false
    },
    onLoad(options) {
        var _this = this;
        id = options.id;
        if (options.name)
            wx.setNavigationBarTitle({
                title: options.name
            });
        if (options.author_mode){
            _this.setData({author_mode: true});
            _this.report_read(id);
        }

        _this.get_post_detail();
    },
    report_read: function (id) {
        wx.request({
            url: app._server + '/api/bbs/poststatus',
            method: 'POST',
            data: app.key({id: id})
        })
    },
    get_post_detail: function () {
        var _this = this;

        wx.showToast({
            title: '加载中',
            icon: 'loading'
        });
        wx.request({
            url: app._server + app.api.bbs_get_posts,
            method: 'GET',
            data: app.key({id: id}),
            success: function (res) {
                wx.hideToast();
                if (res.data.status != 200)
                    return app.showErrorModal('获取内容失败', '加载失败');
                var c = JSON.parse(res.data.data.content);
                res.data.data.content = c[0][1];
                res.data.data.teacher_reply = c.slice(1);
                _this.setData({
                    'author_nickname': res.data.data.author_nickname,
                    'author_avatar': res.data.data.author_avatar,
                    'title': res.data.data.title,
                    'content': res.data.data.content,
                    'teacher_reply': res.data.data.teacher_reply,
                    'original_pic': res.data.data.original_pic,
                    'comment_count': res.data.data.comment_count,
                    'created_at': res.data.data.created_at,
                    'replies': res.data.data.replies
                })
            },
            fail: function () {
                wx.hideToast();
                app.showErrorModal('获取内容失败', '加载失败');
            }
        });
    },

    reply(e) {
        if (e.target.id == 'requestion')
            is_requestion = true;
        else if (e.target.id == 'reply')
            is_requestion = false;
        this.open_model();
    },
    submit: function (e) {
        var _this = this;
        if (!e.detail.value.content)
            return app.showErrorModal('请输入内容！', '错误');
        wx.showLoading({
            title: '提交中',
            mask: true
        });
        wx.request({
            url: app._server + app.api.bbs_reply_post,
            method: 'POST',
            data: app.key({
                'id': id,
                'content': e.detail.value.content,
                'is_requestion': is_requestion
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
                _this.get_post_detail();
                _this.close_model();
            },
            fail: function () {
                wx.hideLoading();
                app.showErrorModal('网络异常', '提交失败');
            }
        });
    },
    open_model() {
        var _this = this;
        this.setData({
            display: 'block'
        });

        setTimeout(function () {
            _this.setData({
                show_model: true,
            });
        }, 150);
    },
    close_model() {
        var _this = this;
        this.setData({
            show_model: false
        });
        setTimeout(function () {
            _this.setData({
                display: 'none'
            });
        }, 200);
    }
})