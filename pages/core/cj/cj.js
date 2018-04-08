//cj.js
//获取应用实例
var app = getApp();
Page({
    data: {
        remind: '加载中',
        btn_loading:false,
        is_minor: false, //是否为辅修
        cjInfo: [],
        xqNum: {
            grade: '',
            semester: ''
        },
        xqName: {
            grade: '',
            semester: ''
        }
    },
    onLoad: function () {
        var _this = this;
        if(!app.cache.grade_is_minor){
            app.saveCache('grade_is_minor', false);
        }else{
            _this.setData({is_minor:true})
        }

        app.loginLoad(function () {
            _this.onLoadAfterLogin.call(_this);
        }, function () {
            wx.showModal({
                title: '错误',
                content: '网络连接出错',
                showCancel: false
            });
        });
    },
    onLoadAfterLogin: function (complete_callback) {
        var _this = this;
        _this.setData({
            id: app.cache.user.id,
            name: app.cache.user.name
        });
        //判断并读取缓存
        if (app.cache.grade) {
            cjRender(app.cache.grade);
        }

        function cjRender(_data) {
            var d = {
                cjInfo: _data,
                remind: ''
            };
            try {
                var grade = parseInt(app.cache.user.class.slice(0, 2));
                var stu_term = ['大一', '大二', '大三', '大四', '大五'][parseInt(_data.term_value[0]) - grade];
                stu_term += ['上学期', '下学期'][parseInt(_data.term_value[1])];
                d['cjInfo']['stu_term_name'] = stu_term;
            } catch (e) {
                console.error(e);
            }
            _this.setData(d);
        }

        wx.showNavigationBarLoading();
        wx.request({
            url: app._server + app.api.get_grade,
            method: 'POST',
            data: app.key({minor:_this.data.is_minor}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var _data = res.data.data;
                    if (_data.data.length > 0) {
                        //保存成绩缓存
                        app.saveCache('grade', _data);
                        cjRender(_data);
                    } else {
                        _this.setData({remind: '暂无数据'});
                    }

                } else {
                    if (res.data.code == 100) {
                        wx.showModal({
                            title: '加载数据失败',
                            content: res.data.message || "数据获取失败,您的教务处密码在绑定小程序后可能进行了更改,请尝试更新密码",
                            cancelText: '暂不更新',
                            confirmText: '更新密码',
                            success: function (res) {
                                if (res.confirm) {
                                    wx.redirectTo({
                                        url: '/pages/more/append'
                                    });
                                }
                            }
                        });
                    } else if (!app.cache.grade) {
                        _this.setData({
                            remind: res.data.message || '获取数据失败'
                        });
                    } else {
                        app.toast(_this, res.data.message || '更新数据失败');
                    }
                }

            },
            fail: function (res) {
                if (!app.cache.grade) {
                    _this.setData({
                        remind: res.data.message || '未知错误'
                    });
                } else {
                    app.toast(_this, "更新数据失败");
                }
            },
            complete: function () {
                wx.hideNavigationBarLoading();
                if(complete_callback)
                    complete_callback();
            }
        });

        function changeNum(num) {
            var china = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            var arr = [];
            var n = ''.split.call(num, '');
            for (var i = 0; i < n.length; i++) {
                arr[i] = china[n[i]];
            }
            return arr.join("")
        }


    },
    show_credit: function (e) {
        var c = e.currentTarget.dataset.credit;
        var n = e.currentTarget.dataset.name;
        app.toast(this, n + " 学分:" + c);
    },
    changeSrc: function (e) {
        var _this = this;
        _this.setData({btn_loading:true});
        _this.data.is_minor = !_this.data.is_minor;
        _this.onLoadAfterLogin(function () {
            _this.setData({
                btn_loading:false,
                is_minor:_this.data.is_minor
            });
            app.saveCache('grade_is_minor', _this.data.is_minor);
        });
    }
});