'use strict';

var util = require('util');

var debug;
var debugLevel = parseInt(process.env.NODE_DEBUG, 16);

if (debugLevel & 0x4) {
    debug = function (errorMessage) {
    	util.error('oDNS: ' + errorMessage);
    };
} else {
    debug = function () {};
}

module.export = debug;