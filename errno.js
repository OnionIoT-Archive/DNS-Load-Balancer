'use strict';

var errorNotification = {
    val: {
		'ENOENT': 2,
		'EINVAL': 22,
		'EMSGSIZE': 90,
    },
    errorCode: null,
    set: function (name) {
		if (typeof name === 'string' && this.val[name]) {
		    this.errorCode = name;
		}
    },
    get: function () {
		return this.errorCode;
    }
};

module.exports = errorNotification;