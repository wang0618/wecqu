//app.js

App({
    version: 'v1.5', //版本号
    //can_read_cache_lowest_version: 0,// 能够兼容的程序最低缓存版本，供更新使用
    launch_option:null,
    onLaunch: function (options) {
        var _this = this;
        _this.launch_option = options;
        //读取缓存
        try {
            var data = wx.getStorageInfoSync();
            if (data && data.keys.length) {
                data.keys.forEach(function (key) {
                    var value = wx.getStorageSync(key);
                    if (value) {
                        _this.cache[key] = value;
                    }
                });
            }
            if (_this.cache.cache_version && _this.cache.cache_version < _this.can_read_cache_lowest_version) {
                wx.clearStorageSync();
                _this.cache = {}
            }

            if (!_this.cache.wx_info) {
                wx.getUserInfo({
                    withCredentials: false,
                    success: function (res) {
                        _this.saveCache('wx_info', res.userInfo);
                    },
                    fail: function () {
                        _this.showErrorModal('拒绝授权将导致小程序内无法显示个人信息，请在下次使用小程序时点击允许授权！', '授权失败');
                    }
                });
            }


        } catch (e) {
            console.warn('获取缓存失败');
        }
    },
    //保存缓存
    saveCache: function (key, value) {
        if (!key) {
            return;
        }
        var _this = this;
        _this.cache[key] = value;
        wx.setStorage({
            key: key,
            data: value
        });
    },
    //清除缓存
    removeCache: function (key) {
        if (!key) {
            return;
        }
        var _this = this;
        _this.cache[key] = '';
        wx.removeStorage({
            key: key
        });
    },
    //后台切换至前台时
    onShow: function () {

    },
    /*
     * 小程序的每个页面都有可能会通过其他人分享的链接进入
     * 所以每个页面在加载时不能保证用户已经登陆，要进行判断
     * */
    loginLoad: function (success_auth, fail_auth) {
        var _this = this;
        if (!_this.cache.user) {  //无登录信息
            _this.authUser(function () {
                typeof success_auth == "function" && success_auth();
            }, function () {
                typeof fail_auth == "function" && fail_auth();
            });
        } else {  //有登录信息
            typeof success_auth == "function" && success_auth();
        }
    },

    //进行用户身份认证后调用response回调函数
    //若用户未绑定这直接重定向到账号绑定页面
    //success(status [,msg]) 认证请求成功回调
    //fail() 认证网络错误回调
    authUser: function (success, fail, not_bind_handler) {
        var _this = this;
        wx.showNavigationBarLoading();
        wx.login({
            success: function (res) {
                if (res.code) {
                    wx.request({
                        method: 'POST',
                        url: _this._server + '/api/user/auth',
                        data: {
                            code: res.code,
                            detail: _this.cache.user ? false : true //本地缓存无用户信息(用户可能清除数据后使用小程序)，则额外获取用户信息
                        },
                        success: function (res) {
                            // console.log(res);
                            if (res.data && res.data.status >= 200 && res.data.status < 400) {
                                var data = res.data.data;
                                if (!data.is_bind) {
                                    wx.hideNavigationBarLoading();
                                    typeof not_bind_handler == "function" && not_bind_handler();
                                    wx.navigateTo({url: '/pages/more/login'});
                                    return;
                                }
                                for (var key in data) {
                                    var value = data[key];
                                    console.log(key, value);
                                    _this.saveCache(key, value);
                                }
                                typeof success == "function" && success(true);
                            } else {
                                typeof fail == "function" && fail(res.data.message);
                            }
                        },
                        fail: function () {
                            typeof fail == "function" && fail();
                        },
                        complete: function () {
                            wx.hideNavigationBarLoading();
                        }
                    });

                }
            },
            fail: function () {
                typeof fail == "function" && fail();
            }
        });
    },

    processData: function (data) {
        var _this = this;
        //var data = JSON.parse(_this.util.base64.decode(key));
        console.log(data);
        _this._user.is_bind = data.is_bind;
        _this._user.openid = data.user.openid;
        _this._user.teacher = (data.user.type == '教职工');
        _this._user.we = data.user;
        _this._time = data.time;
        _this._t = data['\x74\x6f\x6b\x65\x6e'];
        return data;
    },
    getUserInfo: function (cb) {
        var _this = this;
        //获取微信用户信息，需要用户授权
        wx.getUserInfo({
            success: function (res) {
                typeof cb == "function" && cb(res);
            },
            fail: function (res) {
                _this.showErrorModal('拒绝授权将导致无法关联学校帐号并影响使用，请重新打开小程序再点击允许授权！', '授权失败');
                _this.g_status = '未授权';
            }
        });
    },
    //完善信息
    appendInfo: function (data) {
        var _this = this;
        _this.cache = {};
        wx.clearStorage();
        _this._user.we.build = data.build || '';
        _this._user.we.room = data.room || '';
    },
    showErrorModal: function (content, title) {
        wx.showModal({
            title: title || '加载失败',
            content: content || '未知错误',
            showCancel: false
        });
    },
    showLoadToast: function (title, duration) {
        if (duration){
            wx.showToast({
                title: title || '加载中',
                icon: 'loading',
                mask: true,
                duration: duration || 10000
            });
        }else{
            wx.showLoading({
                title:title || '加载中',
                mask:true
            });
        }
    },
    toast: function (that, msg) {
        that.setData({
            show_toast: true,
            toast_text: msg
        });
        setTimeout(function () {
            that.setData({
                show_toast: false
            });
        }, 1000);
    },
    util: require('./utils/util'),
    key: function (data) {
        return this.util.key(data)
    },
    index_show_callback:[],// key,fun(this),回到主页时要调用的回调函数列表
    cache: {},
    _server: 'https://icqu.cquyibandev.com',
    api: {
        get_classtable: '/api/classtable',
        get_cardcost: '/api/card',
        get_cardbalance: '/api/card?get_balance=1',
        get_elefee: '/api/electric',
        get_library_info: '/api/library',
        get_news: '/api/news',
        clear_data: '/api/clear',
        feedback: '/api/feedback',

        bbs_get_posts:"/api/bbs/post",
        bbs_do_post:"/api/bbs/post",
        bbs_reply_post:"/api/bbs/reply",
        bbs_get_user_postslist:"/api/bbs/userpost",
        bbs_post_status:"/api/bbs/poststatus",

        get_grade: '/api/get_kscj.php',
        get_exam_info: '/api/get_ks.php',
        get_empty_room: '/api/get_empty_room.php',
    }
});