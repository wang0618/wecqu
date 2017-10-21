var sliderWidth = 80; // 需要设置slider的宽度，用于计算中间位置 px
var app = getApp();
Page({
    data: {
        tabs: [
            {
                name: '全部',
                type: 'all'
            },
            {
                name: '教务公告',
                type: 'jwc'
            },
            {
                name: '通知简报',
                type: 'lecture'
            },
            {
                name: '综合新闻',
                type: 'news'
            }
        ],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        loading: false,
        current: {
            data: [],
            page: 0,
            remind: '下滑加载更多'
        },

        show_toast: false,
        toast_text: ''
    },
    storage: [
        {
            data: [],
            page: 0,
            remind: '下滑加载更多'
        },
        {
            data: [],
            page: 0,
            remind: '下滑加载更多'
        },
        {
            data: [],
            page: 0,
            remind: '下滑加载更多'
        },
        {
            data: [],
            page: 0,
            remind: '下滑加载更多'
        }
    ],

    onLoad: function () {
        var _this = this;
        wx.getSystemInfo({
            success: function (res) {
                _this.setData({
                    sliderLeft: (res.windowWidth / _this.data.tabs.length - sliderWidth) / 2,
                    sliderOffset: res.windowWidth / _this.data.tabs.length * _this.data.activeIndex
                });
            }
        });
        _this.getNewsList();
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
    tabClick: function (e) {
        var _this = this;
        var id = e.currentTarget.id;
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: id,
            current: _this.storage[id]
        });
        if (_this.data.current.page==0)
            _this.getNewsList();
    },
    //上滑加载更多
    onReachBottom: function () {
        var _this = this;
        _this.getNewsList();
    },

    getNewsList: function (typeId) {
        var _this = this;
        typeId = typeId || _this.data.activeIndex;
        if (_this.data.current.page >= 5) {
            _this.storage[typeId].remind = '没有更多啦';
            _this.setData({
                'current.remind': '没有更多啦'
            });
            return false;
        }
        if (!_this.data.current.page) { //第一次显示tab
            _this.setData({
                'loading': true
            });
        } else {
            _this.setData({
                'current.remind': '正在加载中'
            });
        }

        wx.showNavigationBarLoading();
        wx.request({
            method: 'GET',
            url: app._server + app.api.get_news,
            data: {
                page: _this.storage[typeId].page,
                category: typeId
            },
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    if (_this.data.activeIndex != typeId) {
                        return false;
                    }
                    if (res.data.data.length) {
                        _this.storage[typeId].page++;
                        if (_this.storage[typeId].page==1) { //第一页
                            //无缓存或缓存有更新
                            if (!_this.data.current.data.length ||
                                app.util.md5(JSON.stringify(res.data.data)) != app.util.md5(JSON.stringify(_this.data.current.data))) {
                                _this.storage[typeId].data = res.data.data;
                            }else{
                                return;
                            }
                        } else {
                            _this.storage[typeId].data = _this.storage[typeId].data.concat(res.data.data);
                        }

                        _this.setData({
                            current: _this.storage[typeId],
                            'current.remind': '下滑加载更多'
                        });

                    } else {
                        _this.storage[typeId].remind = '没有更多啦';
                        _this.setData({
                            'current.remind': '没有更多啦'
                        });
                    }
                } else {
                    app.toast(_this,'加载失败');
                    _this.setData({
                        'current.remind': '加载失败'
                    });
                }
            },
            fail: function (res) {
                _this.setData({
                    'current.remind': '加载失败'
                });
                app.toast(_this,'加载失败');
            },
            complete: function () {
                wx.hideNavigationBarLoading();
                wx.stopPullDownRefresh();
                _this.setData({
                    loading: false
                });
            }
        });
    },
});