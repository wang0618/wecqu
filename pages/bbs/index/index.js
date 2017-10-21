let app = getApp();
let now_page = 0;
let loading = false;
Page({
    data: {
        timeline: [],
        model_status:false
    },
    onReady() {
        this.getTimeline();
    },
    onShow() {
        now_page = 0;
        this.data.timeline = [];
        this.getTimeline();
    },
    onPullDownRefresh: function() {
        now_page = 0;
        this.data.timeline = [];
        this.getTimeline();
    },
    onReachBottom() {
        this.getTimeline();
    },
    getTimeline() {
        var _this = this;
        if (loading) return false;
        wx.showToast({
            title: '加载中',
            icon: 'loading'
        });
        loading = true;
        wx.request({
            url: app._server + app.api.bbs_get_posts,
            method: 'GET',
            data: app.key({page: now_page}),
            success: function (res) {
                now_page++;
                wx.hideToast();
                if (res.data.status != 200)
                    return _this.toast('获取帖子失败');
                if (res.data.data.length == 0)
                    return _this.toast('没有更多帖子啦');
                res.data.data.forEach(item => {
                    item.type = ["校园环境", "学生生活", "后勤服务", "食堂意见"][item.type];
                    if (!item.avatar)
                        item.avatar = '/images/bbs/anonymous.png';
                    return item
                });
                _this.setData({
                    timeline: [..._this.data.timeline, ...res.data.data]
                })
            },
            fail: function () {
                wx.hideToast();
                _this.toast('获取帖子失败');
            },
            complete: function () {
                loading = false;
                wx.stopPullDownRefresh();
            }
        });
    },
    previewImage(event) {
        wx.previewImage({
            current: '',
            urls: [event.target.dataset.originalPic]
        })
    },
    toast: function (msg) {
        var _this = this;
        _this.setData({
            show_toast: true,
            toast_text: msg
        });
        setTimeout(function () {
            _this.setData({
                show_toast: false
            });
        }, 1000);
    },
    show_model: function (e) {
        this.setData({
            'model_status': true
        });
    },
    hide_model: function (e) {
        this.setData({
            'model_status': false
        });
    }
});
