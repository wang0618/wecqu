//xf.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        xfData: [], // 学费数据
        stuInfo: {}, // 学生数据
        listAnimation: {} // 列表动画
    },
    // 页面加载
    onLoad: function () {
        var _this = this;
    },
    on_msg:function (event) {
        console.log(event);
    }
});