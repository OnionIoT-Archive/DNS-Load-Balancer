'use strict';

function PointerRecord () {
    this.pointer = (arguments.length == 1) ? arguments[0] : null;
}

PointerRecord.prototype.get = function () {
    return this.pointer;
};

PointerRecord.prototype.set = function (val) {
    return this.pointer = val;
};

module.exports = PointerRecord;