var app = getApp();
Page({
    data: {
        baseinfo: {
            name: '',
            academy: '',
            class: '',
            grade: ''
        },
        campusIndex: 0,
        campusRange: ['选择校区', 'A区', 'B区', 'C区', '虎溪兰园区', '虎溪松园区', '虎溪梅园区', '虎溪竹园区'],

        buildingIndex: 0,
        buildingRange: ['选择楼栋'],

        roomNum: '',

        bind_status_text: ['未绑定', '已绑定', '在此输入密码', ''],
        bind_btn_text: ['绑定账号', '更新密码', '确定', ''],
        bind_status: {jwc: 3, card: 3, library: 3},
        showTopTips: false
    },

    pwd_cache: {
        jwc: '', card: '', library: ''
    },//暂存用户输入的密码

    building_name: [
        ['选择楼栋'],
        ['A栋宿舍', 'C栋宿舍', 'D栋宿舍', '留学生公寓', '1舍学生宿舍', '2舍学生宿舍', '3舍学生宿舍', '4舍学生宿舍', '5舍学生宿舍', '6舍学生宿舍',
            '7舍学生宿舍', '8舍学生宿舍', '9舍学生宿舍', '10舍学生宿舍', '11舍学生宿舍', '12舍学生宿舍'], //A区
        ['1号学生宿舍', '2号学生宿舍', '3号学生宿舍', '4号学生宿舍', '5号学生宿舍', '6号学生宿舍', '7号学生宿舍', '8号学生宿舍', '9号学生宿舍',
            '10号学生宿舍', '11号学生宿舍', '12号学生宿舍'], //B区
        ['1号学生宿舍', '2号学生宿舍', '3号学生宿舍', '4号学生宿舍', '5号学生宿舍'],  //C区
        ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋'], //兰园区
        ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋'],  //松园区
        ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋'],  //梅园区
        ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋']   //竹园区
    ],

    showTopTips: function (msg) {
        var that = this;
        this.setData({
            showTopTips: msg
        });
        setTimeout(function () {
            that.setData({
                showTopTips: false
            });
        }, 2000);
    },

    bindCampusChange: function (e) {
        var that = this;
        that.setData({
            campusIndex: e.detail.value,
            buildingIndex: 0,
            buildingRange: that.building_name[e.detail.value]
        });
    },
    bindBuildingChange: function (e) {
        var that = this;
        that.setData({
            buildingIndex: e.detail.value
        });
    },
    dormitorySubmit: function (e) {
        var that = this;
        console.log(e.detail.value);
        if (e.detail.value.campus == '0')
            return wx.showModal({
                title: '保存失败',
                content: '请选择校区',
                showCancel: false
            });
        if (!e.detail.value.room)
            return wx.showModal({
                title: '保存失败',
                content: '寝室信息填写不完整',
                showCancel: false
            });

        // wx bug: wx.hideLoading() 会 hideToast
        wx.showLoading({
            title: '正在提交',
            mask: true
        });
        wx.request({
            url: app._server + '/api/user/info?set=dormitory',
            method: 'POST',
            data: app.key(e.detail.value),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success',
                        duration: 2000
                    });
                    app.cache.user.dormitory = [parseInt(e.detail.value.campus), parseInt(e.detail.value.building), parseInt(e.detail.value.room)];
                    app.saveCache('user', app.cache.user);
                    //用户返回主页时执行
                    app.index_show_callback.push(['changeCampus', function (that) {
                        //重新渲染课表，因为更新了校区信息，作息时间可能改变
                        if (app.cache.class_table)
                            that.kbRender(app.cache.class_table);

                        //重新获取电费信息
                        that.setData({
                            'card.sdf.show': false,
                            'remind': ''
                        });
                        app.removeCache('ele_fee');
                        that.user_auth_callback(true, '', {library: false, card: false, elefee: true});
                    }]);
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '保存失败',
                        content: res.data.message,
                        showCancel: false
                    });
                }
            },
            fail: function () {
                wx.hideLoading();
                wx.showModal({
                    title: '操作失败',
                    content: '网络错误',
                    showCancel: false
                });
            }
        });
    },

    // 点击账号右边按钮
    bind_account_tap: function (e) {
        var that = this;
        var target = e.target.id;

        if (that.data.bind_status[target] != 2) { // 开始输入密码
            that.data.bind_status[target] = 2;
            that.setData({
                bind_status: that.data.bind_status
            });
        } else {  // 确认完成输入密码
            wx.showLoading({
                title: '验证中',
                mask: true
            });
            wx.request({
                url: app._server + '/api/user/info?set=password',
                method: 'POST',
                data: app.key({
                    target: target, // jwc, card, library
                    password: that.pwd_cache[target]
                }),
                success: function (res) {
                    if (res.data && res.data.status === 200) {
                        wx.showToast({
                            title: '操作成功',
                            icon: 'success',
                            duration: 2000
                        });
                        // 绑定状态变为已绑定
                        that.data.bind_status[target] = 1;
                        that.setData({
                            bind_status: that.data.bind_status
                        });

                        //用户返回主页时执行
                        app.index_show_callback.push(['change_' + target, function (that) {
                            var d = {library: false, card: false, elefee: false};
                            //若card或library账号有更新，返回主页是重新请求数据
                            if (target == 'jwc')
                                return;
                            d[target] = true;
                            that.user_auth_callback(true, '', d);
                        }]);

                    } else {
                        wx.hideLoading();
                        wx.showModal({
                            title: '操作失败',
                            content: res.data.message,
                            showCancel: false
                        });
                    }
                },
                fail: function () {
                    wx.hideLoading();
                    wx.showModal({
                        title: '操作失败',
                        content: '网络错误',
                        showCancel: false
                    });
                }
            });
        }
    },

    save_input: function (e) {
        var that = this;
        var target = e.target.id.substring(1);
        that.pwd_cache[target] = e.detail.value;
    },


    onLoad: function () {
        var that = this;
        wx.showNavigationBarLoading();
        wx.request({
            url: app._server + '/api/user/info?get=1',
            method: 'POST',
            data: app.key({}),
            success: function (res) {
                if (res.data && res.data.status === 200) {
                    var data = res.data.data;
                    that.setData({
                        baseinfo: data.baseinfo,
                        campusIndex: data.baseinfo.dormitory[0],
                        buildingIndex: data.baseinfo.dormitory[1],
                        roomNum: data.baseinfo.dormitory[0] == 0 ? '' : data.baseinfo.dormitory[2],
                        buildingRange: that.building_name[data.baseinfo.dormitory[0]],
                        bind_status: data.password
                    });
                } else {
                    app.showErrorModal('获取个人信息失败', '错误');
                }
            },
            fail: function () {
                app.showErrorModal('获取个人信息失败', '错误');
            },
            complete: function () {
                wx.hideNavigationBarLoading();
            }
        });
    }

});