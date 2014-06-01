function OutgoingMessage (socket, rinfo) {
    Message.call(this, socket, rinfo);
    this.maxSend = 512;
}
sys.inherits(OutgoingMessage, Message);
exports.OutgoingMessage = OutgoingMessage;

OutgoingMessage.prototype._Buffer = new Buffer(ns_maxmsg);

OutgoingMessage.prototype._Writer = new DNSWriter();

OutgoingMessage.prototype.setMaxSend = function (n) {
    if (n > ns_maxmsg)
	throw new Error ("Size must be < 65535");

    this.maxSend = n;
};

OutgoingMessage.prototype.send = function (message) {
    debug('ServerResponse.prototype.send');

    if (arguments.length == 0)
	message = this;

    this._Writer.reinitialize (this._Buffer, 0, Math.min(this.maxSend, this._Buffer.length));

    this._Writer.writeMessage(message);


    this.socket.send(this._Buffer, 0, this._Writer.writeStart, this.rinfo.port, this.rinfo.address, function (err, bytesSent) {
	debug (err || 'bytesSent: ' + bytesSent);
    });
};