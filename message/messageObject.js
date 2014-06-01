function MessageObject () {
    this.length = 0;
}

MessageObject.prototype.add = function () {
    var obj = this[this.length++] = new MessageRecord();
    if (arguments.length > 0)
	obj.set(arguments[0]);
    return obj;
};