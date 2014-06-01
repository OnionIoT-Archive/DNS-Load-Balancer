function MessageHeader () {
}

MessageHeader.prototype.id = 0;
MessageHeader.prototype.qr = 0;
MessageHeader.prototype.opcode = 0;
MessageHeader.prototype.aa = 0;
MessageHeader.prototype.tc = 0;
MessageHeader.prototype.rd = 0;
MessageHeader.prototype.ra = 0;
MessageHeader.prototype.a = 0;
MessageHeader.prototype.ad = 0;
MessageHeader.prototype.cd = 0;
MessageHeader.prototype.rcode = 0;

MessageHeader.prototype.set = function (obj) {
    for (var k in obj)
	this[k] = obj[k];
};
