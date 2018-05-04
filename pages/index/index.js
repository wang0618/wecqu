//index.js
//获取应用实例
var app = getApp();
Page({
    data: {
        offline: false, //离线模式
        remind: '加载中',
        core: [
            {id: 'kb', name: '课表', disabled: false, offline_disabled: false},
            {id: 'ykt', name: '一卡通', disabled: false, offline_disabled: false},
            {id: 'jy', name: '借阅信息', disabled: false, offline_disabled: false},
            {id: 'sdf', name: '寝室电费', disabled: false, offline_disabled: false},
            {id: 'bus', name: '校车时刻', disabled: false, offline_disabled: false},

            {id: 'cj', name: '考试成绩', disabled: true, offline_disabled: true},
            {id: 'ks', name: '考试安排', disabled: true, offline_disabled: true},
            {id: 'kjs', name: '空教室', disabled: true, offline_disabled: true},
            {id: 'xf', name: '学费信息', disabled: true, offline_disabled: true},
            {id: 'more', name: 'more', disabled: true, offline_disabled: true}
        ],
        swiper_index: 0,
        swiper_core: [
            [
                {id: 'kb', name: '课表', url: "/pages/core/kb/kb", disabled: false, offline_disabled: false},
                {id: 'kjs', name: '空教室', url: "/pages/core/kjs/kjs", disabled: false, offline_disabled: false},
                {id: 'ks', name: '考试安排', url: "/pages/core/ks/ks", disabled: false, offline_disabled: false},
                {id: 'cj', name: '考试成绩', url: "/pages/core/cj/cj", disabled: false, offline_disabled: false},
                {id: 'bus', name: '校车时刻', url: "/pages/core/bus/bus", disabled: false, offline_disabled: false},
            ], [
                {id: 'ykt', name: '一卡通', url: "/pages/core/ykt/ykt", disabled: false, offline_disabled: false},
                {id: 'jy', name: '借阅信息', url: "/pages/core/jy/jy", disabled: false, offline_disabled: false},
                {id: 'sdf', name: '寝室电费', url: "/pages/core/sdf/sdf", disabled: false, offline_disabled: false},
            ]
        ],
        card: {
            'kb': {
                show: false,
                data: {}
            },
            'ykt': {
                show: false,
                data: {
                    'last_time': '',
                    'balance': 0,
                    'cost_status': false,
                    'today_cost': {
                        value: [],
                        total: 0
                    }
                }
            },
            'jy': {
                show: false,
                data: {}
            },
            'sdf': {
                show: false,
                data: {
                    'room': '',
                    'record_time': '',
                    'cost': 0,
                    'spend': 0
                }
            }
        },
        user: app.cache.user ? app.cache.user : {},
        disabledItemTap: false, //点击了不可用的导航时是否提示
        show_toast: false,
        toast_text: ''
    },
    classtime_list: [
        [ //老校区作息表
            {'begin': '08:00', 'end': '08:45'},
            {'begin': '08:55', 'end': '09:40'},
            {'begin': '10:10', 'end': '10:55'},
            {'begin': '11:05', 'end': '11:50'},
            {'begin': '14:30', 'end': '15:15'},
            {'begin': '15:25', 'end': '16:10'},
            {'begin': '16:40', 'end': '17:25'},
            {'begin': '17:35', 'end': '18:20'},
            {'begin': '19:30', 'end': '20:15'},
            {'begin': '20:25', 'end': '21:10'},
            {'begin': '21:20', 'end': '22:05'},
            {'begin': '22:15', 'end': '23:00'}
        ],
        [ //新校区作息表
            {'begin': '08:30', 'end': '09:15'},
            {'begin': '09:25', 'end': '10:10'},
            {'begin': '10:30', 'end': '11:15'},
            {'begin': '11:25', 'end': '12:10'},
            {'begin': '14:00', 'end': '14:45'},
            {'begin': '14:55', 'end': '15:40'},
            {'begin': '16:00', 'end': '16:45'},
            {'begin': '16:55', 'end': '17:40'},
            {'begin': '19:00', 'end': '19:45'},
            {'begin': '19:55', 'end': '20:40'},
            {'begin': '20:50', 'end': '21:35'},
            {'begin': '21:45', 'end': '22:30'}
        ]
    ],

    //分享
    onShareAppMessage: function () {
        return {
            title: 'We重大',
            desc: '专属于重大人的小程序, 查课表、一卡通、电费、借阅、空教室全都有 O(∩_∩)O~',
            path: '/pages/index/index'
        };
    },
    //下拉更新
    onPullDownRefresh: function () {
        if (app.cache.user) {
            this.user_auth_callback(true);
        } else {
            wx.stopPullDownRefresh();
        }
    },
    // 一个页面只会调用一次
    onLoad: function (options) {
        /*  页面逻辑
         *  页面加载之后，先将缓存的课表，一卡通，借阅，电费信息显示出来，
         *  调用app.authUser() 进行客户端session (app.cache.sign) 的更新，
         *  正常更新session后，请求一卡通，借阅，电费信息，有数据更新则更新页面，课表在无缓存时进行获取
         *  若用户未绑定账号，则app.authUser()会从重定向至绑定页面
         * */
        var _this = this;
        if (options.title)
            wx.setNavigationBarTitle({
                title: options.title + ' We重大'
            });

        _this.data.user['is_bind'] = app.util.isEmptyObject(_this.data.user) ? false : true;
        if (app.cache.class_table) _this.kbRender(app.cache.class_table);
        if (app.cache.card_balance) _this.yktRender(app.cache.card_balance);
        if (app.cache.library) _this.libraryRender(app.cache.library);
        if (app.cache.ele_fee) _this.eleFeeRender(app.cache.ele_fee);

        app.authUser(function (status, error_msg) {
            _this.user_auth_callback.call(_this, status, error_msg);
        }, function () {
            if (app.cache.user) {
                _this.setData({
                    'offline': true,
                    'user.is_bind': true
                });
                _this.toast('离线缓存模式'); //开启离线缓存模式
            } else {
                _this.setData({'remind': '网络错误'});
            }

        }, function () {
            _this.setData({
                'user.is_bind': false,
                'remind': '未绑定'
            });
        });


    },
    onShow: function () {
        /* 1. 当用户在其他页面修改了用户信息时，再次返回首页时，要进行首页信息的更新
           2. 每次显示首页的时候判断本地session有没有过期，过期则重新获取
        * */
        var _this = this;
        var count = {};
        for (var i = 0; i < app.index_show_callback.length; i++) {
            try {
                var key = app.index_show_callback[i][0];
                if (count[key])
                    continue;
                count[key] = true;
                app.index_show_callback[i][1](_this);
            } catch (e) {
            }
        }
        app.index_show_callback = [];

        var t = parseInt(new Date().getTime().toString().substr(0, 10));
        if (t - app.cache.session_timestamp > app._session_expire_sec) {
            console.log('reauth');
            app.authUser();
        }

        /*重新判断是否有通知，
        * this.user_auth_callback 函数中虽然进行了一次判断，但那是在小程序启动后进行的判断，
        * 用户启动小程序后，可能长时间小程序一直在后台，应该在重新获取session信息后再次判断是后台否有通知
        * */
        if (app.cache.notification_count > 0)
            _this.show_notification_animation();
    },
    /*
    * request_ctrl 用于控制是否重新获取一卡通，电费，借阅的数据
    * */
    user_auth_callback: function (status, error_msg, request_ctrl) {
        var _this = this;
        //如果有未读消息，则播放通知动画
        if (app.cache.notification_count > 0)
            _this.show_notification_animation();
        //认证成功后, 用户信息就写入缓存了
        _this.setData({
            'user.is_bind': true,
            'user.name': app.cache.user.name,
            'user.id': app.cache.user.id
        });

        var loadsum = 0;//正在请求连接数
        function cache_and_render(api, cache_name, render_fun) {
            loadsum++; //新增正在请求连接
            wx.request({
                url: app._server + api,
                method: 'POST',
                data: app.key({}),
                success: function (res) {
                    // if (res.data.status != 200)
                    //     return _this.toast(res.data.message);
                    var info = res.data.data;
                    if (info) {
                        //保存缓存
                        app.saveCache(cache_name, info);
                        render_fun.call(_this, info);
                    }
                },
                complete: function () {
                    loadsum--; //减少正在请求连接
                    if (!loadsum) {
                        if (_this.data.remind == '加载中') {
                            _this.setData({
                                remind: '首页暂无展示'
                            });
                        }
                        wx.hideNavigationBarLoading();
                        wx.stopPullDownRefresh();
                    }
                }
            });
        }

        if (!app.cache.class_table)
            cache_and_render(app.api.get_classtable, 'class_table', _this.kbRender);
        if (!request_ctrl)
            request_ctrl = {library: true, card: true, elefee: true};
        if (request_ctrl.library)
            cache_and_render(app.api.get_library_info, 'library', _this.libraryRender);
        if (request_ctrl.card)
            cache_and_render(app.api.get_cardbalance, 'card_balance', _this.yktRender);
        if (request_ctrl.elefee)
            cache_and_render(app.api.get_elefee, 'ele_fee', _this.eleFeeRender);
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
    tap_disabled_item: function () {
        this.toast('该服务暂时不可用');
    },
    open_notification_center: function () {
        var _this = this;
        wx.navigateTo({
            url: '/pages/core/notification/notification',
            success:function () {
                _this.setData({has_new_notification: false}); // 不显示小红点
            }
        });
    },
    show_notification_animation: function () {
        app.saveCache('notification_count', 0);
        this.setData({
            swiper_index: 1,
            has_new_notification:true
        }); // 切换到第二页
        setTimeout(function () {
            this.setData({shake_notification_icon: true});
        }.bind(this), 700);
        setTimeout(function () {
            this.setData({shake_notification_icon: false});
        }.bind(this), 1800);
    },
    kbRender: function (info) {
        try {
            var _this = this;
            var week = app.util.get_week(info.start_stamp);
            if (week.now < info.start_stamp || week.now > info.end_stamp) {
                var msg = '假期中 Have Fun!!';
                if (week.now < info.start_stamp) {
                    msg = '假期中, ' + (parseInt((info.start_stamp - week.now) / (1440 * 60) + 1)) + '天后开学';
                }
                _this.setData({
                    'card.kb.show': true,
                    'card.kb.nothing_msg': msg,
                    'remind': ''
                });
                return;
            }
            var lessons = info.lessons[week.day], //day为0表示周一
                list = [],
                time_list = false;
            if (app.cache.user && app.cache.user.dormitory && app.cache.user.dormitory[0] != 0) { //用户设置了校区信息
                var index = app.cache.user.dormitory[0] <= 3 ? 0 : 1;
                time_list = _this.classtime_list[index];
            }
            for (var i = 0; i < 6; i++) {
                for (var j = 0; j < lessons[i].length; j++) {
                    var lesson = lessons[i][j];
                    if (lesson.weeks && lesson.weeks.indexOf(parseInt(week.week)) !== -1) {
                        var begin_lesson = 2 * i + 1, end_lesson = 2 * i + lesson.number;
                        var t = begin_lesson + ' - ' + end_lesson + '节';
                        if (time_list) t = t + '（' + time_list[begin_lesson - 1].begin + '~' + time_list[end_lesson - 1].end + '）';
                        list.push({
                            when: t,
                            what: lesson.name,
                            where: lesson.place.trim()
                        });
                    }
                }
            }
            _this.setData({
                'card.kb.data': list,
                'card.kb.show': true,
                'card.kb.nothing_msg': !list.length ? '今日无课' : null,
                'remind': ''
            });
        } catch (e) {
            console.error(app.cache.user.id, app.cache.user.name, e);
        }
    },
    yktRender: function (info) {
        var _this = this;
        _this.setData({
            'card.ykt.data.time': info.time,
            'card.ykt.data.balance': info.balance,
            'card.ykt.show': true,
            'remind': ''
        });
    },
    eleFeeRender: function (info) {
        var _this = this;
        _this.setData({
            'card.sdf.data.room': info.room,
            'card.sdf.data.record_time': info.record_time,
            'card.sdf.data.balance': info.balance,
            'card.sdf.show': true,
            'remind': ''
        });
    },
    libraryRender: function (info) {
        var _this = this;
        if (parseInt(info.books_num) && info.book_list && info.book_list.length) {
            var nowTime = new Date().getTime();
            info.book_list.map(function (e) {
                var oDate = e.yhrq.split('-'),
                    oTime = new Date(oDate[0], oDate[1] - 1, oDate[2]).getTime();
                e.timing = parseInt((oTime - nowTime) / 1000 / 60 / 60 / 24);
                return e;
            });
            _this.setData({
                'card.jy.data': info,
                'card.jy.show': true,
                'remind': ''
            });
        } else { // 没有借阅图书
            _this.setData({'card.jy.show': false});
        }
    }
});