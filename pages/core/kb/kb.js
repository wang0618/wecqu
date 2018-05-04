//kb.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        _days: ['一', '二', '三', '四', '五', '六', '日'],
        _weeks: ['第一周', '第二周', '第三周', '第四周', '第五周', '第六周', '第七周', '第八周', '第九周', '第十周', '十一周', '十二周', '十三周', '十四周', '十五周', '十六周', '十七周', '十八周', '十九周', '二十周', '二十一周', '二十二周', '二十三周', '二十四周', '二十五周'],

        timelineTop: 0,
        scroll: {
            left: 0 //设置课表区域横向滚动条位置
        },
        targetLessons: [],
        targetX: 0, //target x轴top距离
        targetY: 0, //target y轴left距离
        targetDay: 0, //target day
        targetWid: 0, //target wid
        targetI: 0,   //target 第几个active
        targetLen: 0, //target 课程长度
        blur: false,
        today: '',  //当前星期数
        toweek: 1,  //当前周数
        week: 1,    //视图周数（'*'表示学期视图）
        lessons: [],  //课程data
        dates: [],     //本周日期
        teacher: false,   //是否为教师课表
        in_holiday: false
    },
    _time: [ //课程时间
        [//老校区
            {'begin': '00:00', 'end': '07:59'},
            {'begin': '08:00', 'end': '09:40'},
            {'begin': '09:41', 'end': '10:09'},
            {'begin': '10:10', 'end': '11:50'},
            {'begin': '11:51', 'end': '14:29'},
            {'begin': '14:30', 'end': '16:10'},
            {'begin': '16:11', 'end': '16:39'},
            {'begin': '16:40', 'end': '18:20'},
            {'begin': '18:21', 'end': '19:29'},
            {'begin': '19:30', 'end': '21:10'},
            {'begin': '21:11', 'end': '21:19'},
            {'begin': '21:20', 'end': '23:00'},
            {'begin': '23:01', 'end': '23:59'}
        ],
        [//新校区
            {'begin': '00:00', 'end': '08:29'},
            {'begin': '08:30', 'end': '10:10'},
            {'begin': '10:11', 'end': '10:29'},
            {'begin': '10:30', 'end': '12:10'},
            {'begin': '12:11', 'end': '13:59'},
            {'begin': '14:00', 'end': '15:40'},
            {'begin': '15:41', 'end': '15:59'},
            {'begin': '16:00', 'end': '17:40'},
            {'begin': '17:41', 'end': '17:59'},
            {'begin': '19:00', 'end': '20:40'},
            {'begin': '20:41', 'end': '20:49'},
            {'begin': '20:50', 'end': '22:30'},
            {'begin': '22:31', 'end': '23:59'}
        ]
    ],
    //指针位置
    cursor_pos: [
        {beginTop: -4, endTop: -4},
        {beginTop: 0, endTop: 200},
        {beginTop: 204, endTop: 204},
        {beginTop: 208, endTop: 408},
        {beginTop: 414, endTop: 414},
        {beginTop: 420, endTop: 620},
        {beginTop: 624, endTop: 624},
        {beginTop: 628, endTop: 828},
        {beginTop: 834, endTop: 834},
        {beginTop: 840, endTop: 1040},
        {beginTop: 1044, endTop: 1044},
        {beginTop: 1048, endTop: 1248},
        {beginTop: 1254, endTop: 1254}
    ],
    //分享
    onShareAppMessage: function () {
        return {
            title: '我的课表',
            desc: '我正在使用"We重大"小程序查看课表',
            path: '/pages/core/kb/kb'
        };
    },
    onLoad: function (options) {
        var _this = this;
        app.loginLoad(function () {
            _this.loginHandler.call(_this, options);
        }, function () {
            wx.showModal({
                title: '错误',
                content: '网络连接出错',
                showCancel: false
            });
        });
    },
    //让分享时自动登录
    loginHandler: function (options) {
        var _this = this;
        _this.setData({
            'term': app.cache.term.name
        });
        // onLoad时获取一次课表
        var id = options.id || app.cache.user.id;
        if (options.name) {
            _this.setData({
                name: options.name
            });
        }
        if (app.cache.class_table) {
            _this.set_kb(app.cache.class_table);
        } else { // 没有课表缓存,获取课表
            _this.request_classtable();
        }
    },
    onShow: function () {
        var _this = this;

        // 计算timeline时针位置
        function parseMinute(dateStr) {
            return dateStr.split(':')[0] * 60 + parseInt(dateStr.split(':')[1]);
        }

        function compareDate(dateStr1, dateStr2) {
            return parseMinute(dateStr1) <= parseMinute(dateStr2);
        }

        var term_info = app.util.get_week(app.cache.class_table.start_stamp);
        var in_holiday = (term_info.now < app.cache.class_table.start_stamp || term_info.now > app.cache.class_table.end_stamp);
        var nowTime = app.util.formatTime(new Date(), 'h:m');
        var pos = _this.cursor_pos;
        if (app.cache.user && app.cache.user.dormitory && app.cache.user.dormitory[0] != 0 && !in_holiday) { //用户设置了校区信息并且不在假期
            var index = app.cache.user.dormitory[0] <= 3 ? 0 : 1;
            _this._time[index].forEach(function (e, i) {
                if (compareDate(e.begin, nowTime) && compareDate(nowTime, e.end)) {
                    _this.setData({
                        timelineTop: Math.round(pos[i].beginTop + (pos[i].endTop - pos[i].beginTop) * (parseMinute(nowTime) - parseMinute(e.begin)) / 100)
                    });
                }
            });
        }
    },
    onReady: function () {
        var _this = this;
        //查询其他人课表时显示
        if (_this.data.name) {
            wx.setNavigationBarTitle({
                title: _this.data.name + '的课表'
            });
        }
    },
    request_classtable: function () {
        //获取课表
        var _this = this;
        wx.showLoading({
            title: '更新中',
            mask: true
        });
        wx.showNavigationBarLoading();
        wx.request({
            url: app._server + app.api.get_classtable,
            method: 'POST',
            data: app.key({}),
            success: function (res) {
                wx.hideLoading();
                if (res.data && res.data.status === 200) {
                    var _data = res.data.data;
                    if (_data) {
                        app.saveCache('class_table', _data);
                        _this.set_kb(_data);
                        wx.showToast({
                            title: '更新课表成功',
                            icon: 'success',
                            duration: 1000
                        });
                        //用户返回主页时重新显示课表数据
                        app.index_show_callback.push(['kbRender', function (that) {
                            that.kbRender.call(that, _data);
                        }]);
                    } else {
                        _this.setData({remind: '暂无数据'});
                    }
                } else {
                    //app.removeCache('class_table');
                    if (!app.cache.class_table) {
                        _this.setData({
                            remind: res.data.message || '获取数据失败'
                        });
                    } else {
                        app.showErrorModal('错误', res.data.message || '更新数据失败');
                    }
                }
            },
            fail: function (res) {
                wx.hideLoading();

                if (!app.cache.class_table) {
                    _this.setData({
                        remind: '网络错误'
                    });
                } else {
                    app.showErrorModal('网络错误', '更新失败');
                }
            },
            complete: function () {
                wx.hideNavigationBarLoading();
            }
        });
    },
    update_classtable: function () {
        var _this = this;
        wx.showModal({
            title: '重新获取课表？',
            content: '小程序将登录教务处获取最新课表，是否继续',
            showCancel: true,
            success: function (res) {
                if (!res.confirm) {
                    return;
                }
                _this.request_classtable();
            }
        });

    },
    showDetail: function (e) {
        // 点击课程卡片后执行
        var _this = this;
        var week = _this.data.week;
        var dataset = e.currentTarget.dataset;
        // console.log(dataset,e.currentTarget);return;
        var lessons = [];
        var targetI = 0;

        if (dataset.cid == undefined) { //点击了空白处或者卡片overflow的地方
            for (var t = 0; t < dataset.wid; t++) {
                lessons = lessons.concat(_this.data.lessons[dataset.day][t].filter(function (e) {
                    var res = (e.number / 2 + t - 1) >= dataset.wid;
                    if (res)
                        dataset.wid = t;
                    return res;
                }));
            }
        } else {
            lessons = _this.data.lessons[dataset.day][dataset.wid];
            lessons[dataset.cid].target = true;
        }
        if (week != '*') {
            lessons = lessons.filter(function (e) {
                return e.weeks.indexOf(parseInt(week)) !== -1;
            });
        }
        lessons.map(function (e, i) {
            if (lessons.length === 1) {
                e.left = 0;
            } else {
                //笼罩层卡片防止超出课表区域
                //周一~周四0~3:n lessons.length>=2*n+1时，设置left0为-n*128，否则设置为-60*(lessons.length-1)；
                //周日~周五6~4:n lessons.length>=2*(6-n)+1时，设置left0为-(7-n-lessons.length)*128，否则设置为-60*(lessons.length-1)；
                var left0 = -60 * (lessons.length - 1);
                if (dataset.day <= 3 && lessons.length >= 2 * dataset.day + 1) {
                    left0 = -dataset.day * 128;
                } else if (dataset.day >= 4 && lessons.length >= 2 * (6 - dataset.day) + 1) {
                    left0 = -(7 - dataset.day - lessons.length) * 128;
                }
                e.left = left0 + 128 * i;
            }
            return e;
        });
        lessons.forEach(function (e, i) {
            if (e.target) {
                targetI = i;
                lessons[i].target = false;
            }
        });
        if (!lessons.length) {
            return false;
        }
        _this.setData({
            targetX: dataset.day * 129 + 35 + 8,
            targetY: dataset.wid * 206 + Math.floor(dataset.wid / 2) * 4 + 60 + 8,
            targetDay: dataset.day,
            targetWid: dataset.wid,
            targetI: targetI,
            targetLessons: lessons,
            targetLen: lessons.length,
            blur: true
        });
    },
    hideDetail: function () {
        // 点击遮罩层时触发，取消主体部分的模糊，清空target
        this.setData({
            blur: false,
            targetLessons: [],
            targetX: 0,
            targetY: 0,
            targetDay: 0,
            targetWid: 0,
            targetI: 0,
            targetLen: 0
        });

    },
    infoCardTap: function (e) {
        var dataset = e.currentTarget.dataset;
        if (this.data.targetI == dataset.index) {
            return false;
        }
        this.setData({
            targetI: dataset.index
        });
    },
    infoCardChange: function (e) {
        var current = e.detail.current;
        if (this.data.targetI == current) {
            return false;
        }
        this.setData({
            targetI: current
        });
    },
    chooseView: function () {
        app.showLoadToast('切换视图中', 500);
        //切换视图(周/学期) *表示学期视图
        this.setData({
            week: this.data.week == '*' ? this.data.toweek : '*'
        });
    },
    returnCurrent: function () {
        //返回本周
        this.setData({
            week: this.data.toweek
        });
    },
    currentChange: function (e) {
        // 更改底部周数时触发，修改当前选择的周数
        var current = e.detail.current
        this.setData({
            week: current + 1
        });
    },
    catchMoveDetail: function () { /*阻止滑动穿透*/
    },
    bindStartDetail: function (e) {
        this.setData({
            startPoint: [e.touches[0].pageX, e.touches[0].pageY]
        });
    },
    //滑动切换课程详情
    bindMoveDetail: function (e) {
        var _this = this;
        var curPoint = [e.changedTouches[0].pageX, e.changedTouches[0].pageY],
            startPoint = _this.data.startPoint, i = 0;
        if (curPoint[0] <= startPoint[0]) {
            if (Math.abs(curPoint[0] - startPoint[0]) >= Math.abs(curPoint[1] - startPoint[1])) {
                if (_this.data.targetI != _this.data.targetLen - 1) {
                    i = 1;//左滑
                }
            }
        } else {
            if (Math.abs(curPoint[0] - startPoint[0]) >= Math.abs(curPoint[1] - startPoint[1])) {
                if (_this.data.targetI != 0) {
                    i = -1;//右滑
                }
            }
        }
        if (!i) {
            return false;
        }
        _this.setData({
            targetI: parseInt(_this.data.targetI) + i
        });
    },
    //点击左右按钮切换swiper
    swiperChangeBtn: function (e) {
        var _this = this;
        var dataset = e.currentTarget.dataset, i, data = {};
        if (dataset.direction == 'left') {
            i = -1;
        }
        else if (dataset.direction == 'right') {
            i = 1;
        }
        data[dataset.target] = parseInt(_this.data[dataset.target]) + i;
        _this.setData(data);
    },
    set_kb: function (kb_data) {
        //数组去除指定值
        function removeByValue(array, val) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] == val) {
                    array.splice(i, 1);
                    break;
                }
            }
            return array;
        }

        // 根据获取课表
        var _this = this;
        //判断并读取缓存
        kbRender(kb_data);

        //课表渲染
        function kbRender(_data) {
            var colors = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'];
            var i, ilen, j, jlen, k, klen;
            var colorsDic = {};
            var _lessons = _data.lessons;
            var _colors = colors.slice(0); //暂存一次都未用过的颜色
            // 循环课程
            for (i = 0, ilen = _lessons.length; i < ilen; i++) {
                for (j = 0, jlen = _lessons[i].length; j < jlen; j++) {
                    for (k = 0, klen = _lessons[i][j].length; k < klen; k++) {
                        // if (_lessons[i][j][k] && _lessons[i][j][k].class_id) {
                        if (_lessons[i][j][k]) {
                            // 找出冲突周数,及课程数
                            var conflictWeeks = {};
                            _lessons[i][j][k].weeks.forEach(function (e) {
                                for (var n = 0; n < klen; n++) {
                                    if (n !== k && _lessons[i][j][n].weeks.indexOf(e) !== -1) {
                                        !conflictWeeks[e] ? conflictWeeks[e] = 2 : conflictWeeks[e]++;
                                    }
                                }
                            });
                            _lessons[i][j][k].conflictWeeks = conflictWeeks;
                            _lessons[i][j][k].klen = klen;
                            _lessons[i][j][k].xf_num = _lessons[i][j][k].xf ? parseFloat(_lessons[i][j][k].xf).toFixed(1) : '';
                            // 为课程上色
                            if (!colorsDic[_lessons[i][j][k].name]) { //如果该课还没有被上色
                                colorsDic[_lessons[i][j][k].name] = colors[Object.keys(colorsDic).length];
                            }
                            _lessons[i][j][k].color = colorsDic[_lessons[i][j][k].name];
                        }
                    }
                }
            }
            var week_info = app.util.get_week(_data.start_stamp);
            var week = week_info.week;
            var today = week_info.day;  //0周一,1周二...6周日
            var in_holiday = false;
            var nowWeek = new Date().getDay();
            //设置滚动至当前时间附近，如果周末为设置left为其最大值102
            var scroll_left = (nowWeek === 6 || nowWeek === 0) ? 102 : 0;

            if (week_info.now < _data.start_stamp || week_info.now > _data.end_stamp) {
                //假期中
                week = 1;
                today = 0;
                scroll_left = 0;
                in_holiday = true;
            }

            var lessons = _data.lessons;
            //各周日期计算
            var startDate = new Date(_data.start_stamp * 1000);
            var dates = _this.data._weeks.slice(0);  //0:第1周,1:第2周,..19:第20周
            dates = dates.map(function (e, m) {
                var idates = _this.data._days.slice(0);  //0:周一,1:周二,..6:周日
                idates = idates.map(function (e, i) {
                    var d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + m * 7 + i);
                    return {
                        month: d.getMonth() + 1,
                        date: d.getDate()
                    }
                });
                return idates;
            });


            _this.setData({
                today: today,
                week: week,
                toweek: week,
                lessons: lessons,
                dates: dates,
                'scroll.left': scroll_left,
                in_holiday: in_holiday,
                remind: ''
            });
        }


    }
});