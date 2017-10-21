//detail.js
var app = getApp();
Page({
    data: {
        remind: "加载中",
        id: "",
        title: "",    // 新闻标题
        date: "",     // 发布日期
        content: "",  // 新闻内容
        url: '',
        files_len: 0,  // 附件数量
        files_list: [],
        file_loading: false, //下载状态
        source: '',   // 附件来源
        model_status: false
    },
    //分享
    /*onShareAppMessage: function () {
      /*        var _this = this;
                return {
                    title: _this.data.title,
                    desc: '',
                    path: 'pages/news/' + _this.data.type + '/' + _this.data.type + '_detail?type=' + _this.data.type + '&id=' + _this.data.id
                }
},*/

    convertHtmlToText: function (inputText) {
        var returnText = "" + inputText;
        returnText = returnText.replace(/<\/?[^>]*>/g, '').replace(/[ | ]*\n/g, '\n').replace(/ /ig, '')
            .replace(/&mdash/gi, '-').replace(/&ldquo/gi, '“').replace(/&rdquo/gi, '”');
        return returnText;
    },

    onLoad: function (options) {
        var _this = this;
        try {
            wx.setNavigationBarColor({
                frontColor: '#ffffff',
                backgroundColor: ['', '#73b4ef', '#7acfa6', '#ffcb63'][parseInt(options.type)],
                animation: {
                    duration: 400,
                    timingFunc: 'easeIn'
                }
            });
            wx.setNavigationBarTitle({
                title: ['', '教务公告', '通知简报', '综合新闻'][parseInt(options.type)]
            });
        } catch (e) {

        }

        app.loginLoad(function () {
            _this.loginHandler.call(_this, options);
        });
    },
    loginHandler: function (options) {
        var _this = this;

        if (!options.type || !options.id) {
            _this.setData({
                remind: '404'
            });
            return false;
        }
        _this.setData({
            'type': options.type,
            id: options.id
        });
        options.openid = app.cache.user.id;
        wx.request({
            method: 'POST',
            url: app._server + app.api.get_news,
            data: app.key({id: options.id}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var info = res.data.data;
                    _this.setData({
                        date: info.date,  // 发布日期
                        title: info.title,            //新闻标题
                        content: info.content.content,  // 新闻内容
                        url: info.url,
                        remind: ''
                    });

                    // 如果存在附件则提取附件里面的信息
                    if (info.content.appendix && info.content.appendix.length) {
                        info.content.appendix.map(function (e) {
                            //判断是否支持预览
                            e[2] = (e[1].search(/\.doc|.xls|.ppt|.pdf|.docx|.xlsx|.pptx$/) !== -1);
                            return e;
                        });
                        _this.setData({
                            files_len: info.content.appendix.length,
                            files_list: info.content.appendix
                        });
                    }
                } else {
                    app.showErrorModal(res.data.message);
                    _this.setData({
                        remind: res.data.message || '未知错误'
                    });
                }
            },
            fail: function () {
                app.showErrorModal(res.errMsg);
                _this.setData({
                    remind: '网络错误'
                });
            }
        })
    },

    getFj: function (e) {
        var _this = this;
        if (!e.currentTarget.dataset.preview) {
            app.showErrorModal('不支持该格式文件预览！', '无法预览');
            return;
        }
        wx.showModal({
            title: '提示',
            content: '预览或下载附件需要消耗流量，是否继续？',
            confirmText: '继续',
            success: function (res) {
                if (res.confirm) {
                    app.showLoadToast('下载中，请稍候');
                    wx.showNavigationBarLoading();
                    _this.setData({
                        file_loading: true
                    });
                    //下载
                    wx.downloadFile({
                        url: e.currentTarget.dataset.url,
                        success: function (res) {
                            var filePath = res.tempFilePath;
                            //预览
                            wx.openDocument({
                                filePath: filePath,
                                success: function (res) {
                                    console.info('预览成功');
                                },
                                fail: function (res) {
                                    app.showErrorModal(res.errMsg, '预览失败');
                                },
                                complete: function () {
                                    wx.hideNavigationBarLoading();
                                    wx.hideToast();
                                    _this.setData({
                                        file_loading: false
                                    });
                                }
                            });
                        },
                        fail: function (res) {
                            app.showErrorModal(res.errMsg, '下载失败');
                            wx.hideNavigationBarLoading();
                            wx.hideToast();
                            _this.setData({
                                file_loading: false
                            });
                        }
                    });
                }
            }
        });
    },
    tap_model: function (e) {
        if (e.target.id == 'model') {
            this.hide_model();
        }
    },
    //点击“原文链接”
    show_model: function (e) {
        var this_ = this;
        wx.setClipboardData({
            data: this_.data.url,
            success: function (res) {
                app.toast(this_, '原文链接已复制到剪切板')
            }
        })

        // this.setData({
        //     'model_status': true
        // });
    },
    hide_model: function (e) {
        this.setData({
            'model_status': false
        });
    }
});