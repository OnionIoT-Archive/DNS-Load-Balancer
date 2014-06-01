function ClientRequest(client, socket, port, host) {
    OutgoingMessage.call(this, socket, { port: port, address: host });

    this.client = client;
    this.socket = socket;

    this.port = port;
    this.host = host;
}
sys.inherits(ClientRequest, OutgoingMessage);
exports.ClientRequest = ClientRequest;

ClientRequest.prototype.send = function (message) {
    debug('ClientRequest.prototype.send');

    if (arguments.length == 0)
	message = this;

    this.client.pending.push({
	time: new Date(),
	request: this,
	id: message.header.id,
	rinfo: this.rinfo
    });

    this._Writer.reinitialize (this._Buffer, 0, Math.min(this._Buffer.length, this.maxSend));

    this._Writer.writeMessage(message);

    this.socket.send(this._Buffer, 0, this._Writer.writeStart, this.rinfo.port, this.rinfo.address, function (err, bytesSent) {
	debug (err || 'bytesSent: ' + bytesSent);
    });
};