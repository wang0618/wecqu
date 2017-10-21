//more.js
//获取应用实例
var app = getApp();
Page({
    data: {
        'user': {'name':'','id':''},
        'time': {
            'term': '',
            'week': '',
            'day': ''
        },
        'is_bind': false,
        'avatarUrl': ''
    },
    onShow: function () {
        if(app.cache.user)
            this.getData();
        else{

        }
    },
    getData: function () {
        var _this = this;
        var days = ['一', '二', '三', '四', '五', '六', '日'];
        var week_info = app.util.get_week(app.cache.term.start_stamp);
        _this.setData({
            'user': app.cache.user || {},
            'time': {
                'term': app.cache.term.term,
                'week': week_info.week,
                'day': days[week_info.day]
            },
            'is_bind': !!app.cache.user,
            'avatarUrl': app.cache.wx_info.avatarUrl
        });
    }
});