//xf.js
//获取应用实例
var app = getApp();
Page({
    data: {
    },
    // 页面加载
    onLoad: function () {
        var data = {
            timestamp:new Date().getTime().toString().substr(0, 10),
            session:app.cache.session,
            stuid:app.cache.user.id
        };

        this.setData({
            src:'https://wecqu.com/msg/?t='+data.timestamp+'&session='+data.session+'&stuid='+data.stuid
        });
    }
});