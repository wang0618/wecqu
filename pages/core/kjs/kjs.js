//kjs.js
//获取应用实例
var app = getApp();

// 定义常量数据
var CAMPUS_DATA_ = ['A区', 'B区', 'C区', '虎溪'],
    DAY_DATA_ = ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '下周一', '下周二', '下周三', '下周四', '下周五', '下周六', '下周日'],
    CLASSTIME_DATA_ = ['', {time: '1-2节', index: '1',active:true}, {time: '3-4节', index: '2',active:false}, {time: '5-6节', index: '3',active:false},
        {time: '7-8节', index: '4',active:false}, {time: '9-10节', index: '5',active:false}, {time: '11-12节', index: '6',active:false}],
    BUILDING_DATA_ = [
        [
            {'id': '103', 'name': '八教'}, {'id': '109', 'name': '五教'}, {'id': '102', 'name': '主教'},
            {'id': '107', 'name': '二教'}, {'id': '136', 'name': '综合楼'}, {'id': '101', 'name': '理科楼'}
        ],
        [{'id': '202', 'name': '二综'}, {'id': '204', 'name': 'B固'}],
        [{'id': '301', 'name': '继续教育学院'}],
        [{'id': '404', 'name': '一教'}, {'id': '408', 'name': '综合楼'}, {'id': '416', 'name': 'DYC'}]
    ];

function getWeekList() {
    var d = (new Date()).getDay();
    d = (d + 6) % 7;
    return DAY_DATA_.slice(d, d + 7);
}

Page({
    data: {
        scroll_area_height: 360,
        DATA: {
            CAMPUS_DATA: CAMPUS_DATA_,
            DAY_DATA: getWeekList(),
            CLASSTIME_DATA: CLASSTIME_DATA_,
            BUILDING_DATA: BUILDING_DATA_[0],
        },
        active: { // 发送请求的数据对象 初始为默认值
            weekDay: 0,
            buildingIndex: 0,
            classNo: 1,
            campusNo: 0
        },
        testData: null
    },

    onLoad: function (query) {
        var that = this;

        //用户通过二维码直接打开的空教室查询 see https://mp.weixin.qq.com/debug/wxadoc/dev/api/qrcode.html
        if (decodeURIComponent(query.scene) == '1024') {
            wx.setNavigationBarTitle({
                title: 'We重大 空教室查询'
            });
        }
        //设置校区信息
        if (app.cache.local_campus != undefined) {
            that.setData({
                'DATA.BUILDING_DATA': BUILDING_DATA_[app.cache.local_campus],
                'active.campusNo': app.cache.local_campus
            });
        } else if (app.cache.user && app.cache.user.dormitory && parseInt(app.cache.user.dormitory[0]) != 0) { //用户设置了校区信息
            var c = parseInt(app.cache.user.dormitory[0]);
            that.setData({
                'DATA.BUILDING_DATA': BUILDING_DATA_[c - 1]
            });
        }
        if (app.cache.local_building != undefined) {
            that.setData({
                'active.buildingIndex': app.cache.local_building
            });
        }

        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    scroll_area_height: res.windowHeight - 480 / 750.0 * res.windowWidth
                })
            }
        });

        // 初始默认显示
        this.sendRequest();
    },

    //下拉更新
    onPullDownRefresh: function () {
        this.sendRequest();
    },

    // 发送请求的函数
    sendRequest: function () {
        // app.showLoadToast();
        wx.showToast({
            title: '加载中',
            icon: 'loading'
        });
        var that = this;
        var activeData = that.data.active;
        var class_ = '';
        for(var i=1;i<that.data.DATA.CLASSTIME_DATA.length;i++){
            if(that.data.DATA.CLASSTIME_DATA[i].active)
                class_ += that.data.DATA.CLASSTIME_DATA[i].index;
        }
        var requestData = {
            version:app.version_id,
            weekNo: activeData.weekNo,
            day: activeData.weekDay,
            class_: class_,
            building: BUILDING_DATA_[activeData.campusNo][activeData.buildingIndex].id
        };

        // 对成功进行处理
        function doSuccess(data) {
            that.setData({
                'testData': data,
                'errObj.errorDisplay': true
            });
        }

        // 对失败进行处理
        function doFail(message) {
            app.showErrorModal(message);
        }

        // 发送请求
        wx.request({
            url: app._server + '/api/emptyroom',
            method: 'POST',
            data: requestData,
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    doSuccess(res.data.data);
                    //执行回调函数
                } else {
                    doFail(res.data.message);
                }
            },
            fail: function (res) {
                doFail(res.errMsg);
            },
            complete: function () {
                wx.hideToast();
                wx.stopPullDownRefresh();
            }
        });
    },

    chooseCampus: function (e) {
        var index = parseInt(e.target.dataset.campusno, 10);
        if (isNaN(index)) {
            return false;
        }
        app.saveCache('local_campus', index);
        app.saveCache('local_building', 0);
        this.setData({
            'DATA.BUILDING_DATA': BUILDING_DATA_[index],
            'active.buildingIndex': 0,
            'active.campusNo': index
        });
        this.sendRequest();
    },

    // day
    chooseDay: function (e) {
        var index = parseInt(e.target.dataset.dayno, 10);
        if (isNaN(index)) {
            return false;
        }
        this.data.active.weekDay = index;
        this.setData({'active.weekDay': index});
        this.sendRequest();
    },

    // classTime
    chooseClaasTime: function (e) {
        var index = e.target.dataset.classno;
        if (isNaN(index)) {
            return false;
        }

        var choose_sum = 0;
        for(var i=1;i<this.data.DATA.CLASSTIME_DATA.length;i++){
            if(this.data.DATA.CLASSTIME_DATA[i].active){
                choose_sum++;
            }
        }
        if(choose_sum==1 && this.data.DATA.CLASSTIME_DATA[index].active){
            return app.toast(this, '请至少选择一个时间段');
        }

        var t = {};
        t['DATA.CLASSTIME_DATA['+index+'].active'] = !this.data.DATA.CLASSTIME_DATA[index].active;
        this.setData(t);
        this.sendRequest();
    },

    // building
    chooseBuilding: function (e) {

        var index = parseInt(e.target.dataset.buildingindex, 10);

        if (isNaN(index)) {
            return false;
        }
        app.saveCache('local_building', index);
        this.data.active.buildingIndex = index;
        this.setData({'active.buildingIndex': index});
        this.sendRequest();
    }
});