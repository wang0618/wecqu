//格式化时间
function formatTime(date, t) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if (t === 'h:m') {
        return [hour, minute].map(formatNumber).join(':');
    }
    else {
        return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
    }
}
function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}

//判断是否为纯粹对象
function isPlainObject(obj) {
    if (!obj || obj.toString() !== "[object Object]" || obj.nodeType || obj.setInterval) {
        return false;
    }
    if (obj.constructor && !obj.hasOwnProperty("constructor") && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf")) {
        return false;
    }
    for (var key in obj) {
    }
    return key === undefined || obj.hasOwnProperty(key);
}
function cloneObj(obj) {
    if (!isPlainObject(obj)) {
        return false;
    }
    return JSON.parse(JSON.stringify(obj));
}

//md5&base64
var md5 = require('md5.min.js'), base64 = require('base64.min.js'),
    key = function (data) {
        if (!isPlainObject(data)) {
            return false;
        }
        var json_data = JSON.stringify(data);
        var timestamp = parseInt(new Date().getTime().toString().substr(0, 10));
        var app = getApp();
        return {
            timestamp: timestamp,
            sign: md5(json_data + timestamp + app.cache.session).substr(0, 10) + app.cache.user.id,
            data: json_data
        };
    };

function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}

// 获取当前周数和星期数（0表示周一）
function get_week(start_stamp) {
    var now = parseInt(new Date().getTime().toString().substr(0, 10));
    var intval = (now - start_stamp) / 86400;
    return {
        week: parseInt(intval / 7) + 1,
        day: parseInt(intval % 7)
    }
}

module.exports = {
    formatTime: formatTime,
    md5: md5,
    base64: base64,
    key: key,
    isEmptyObject: isEmptyObject,
    get_week:get_week
};