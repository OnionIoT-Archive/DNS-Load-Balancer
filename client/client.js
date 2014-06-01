function Client(type, responseListener) {
    dgram.Socket.call(this, type);

    this.pending = [];

    if (responseListener) {
	this.on("response", responseListener);
    }

    this.on("message", clientMessageListener);
    this.bind();
}
sys.inherits(Client, dgram.Socket);
exports.Client = Client;

Client.prototype.request = function (port, host) {
    var req = new ClientRequest(this, this, port, host);
    return req;
};

Client.prototype.defaultType = 'udp4';

Client.prototype.parser = parsers.alloc();

function clientMessageListener(msg, rinfo) {
    var self = this;

    debug("new message");

    this.parser.reinitialize(msg, 0, msg.length);
    this.parser.socket = this;
    this.parser.rinfo = rinfo;

    this.parser.onIncoming = function (res) {
	var i, item;
	self.emit("response", res);
	for (i = 0; i < self.pending.length; i++) {
	    item = self.pending[i];
	    if (item.id == res.header.id &&
		item.rinfo.address == rinfo.address &&
		item.rinfo.port == rinfo.port) {

		item.request.emit("response", res);
		self.pending.splice(i, 1);
	    }
	}
    };
    this.parser.onError = debug;

    this.parser.parseMessage();
}
