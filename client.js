'use strict';

var util = require('util'),
    dgram = require('dgram');

var message = require('./messages'),
    debug = require('./debug'),
    parsers = require('./parsers');


/****************
    Client request object
****************/

var ClientRequest = function (client, socket, port, host) {
    messages.OutgoingMessage.call(this, socket, { port: port, address: host });

    this.client = client;
    this.socket = socket;

    this.port = port;
    this.host = host;
};
util.inherits(ClientRequest, messages.OutgoingMessage);

ClientRequest.prototype.send = function (message) {
    debug('ClientRequest.prototype.send');

    if (arguments.length == 0) {
        message = this;
    }

    this.client.pending.push({
        time: new Date(),
        request: this,
        id: message.header.id,
        rinfo: this.rinfo
    });

    this._Writer.reinitialize(this._Buffer, 0, Math.min(this._Buffer.length, this.maxSend));

    this._Writer.writeMessage(message);

    this.socket.send(this._Buffer, 0, this._Writer.writeStart, this.rinfo.port, this.rinfo.address, function (err, bytesSent) {
        debug(err || 'bytesSent: ' + bytesSent);
    });
};


/****************
    Client object
****************/

var Client = function (type, responseListener) {
    dgram.Socket.call(this, type);

    this.pending = [];

    if (responseListener) {
	   this.on('response', responseListener);
    }

    this.on('message', function (msg, rinfo) {
        var self = this;

        debug('new message');

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
    });

    this.bind();
};
util.inherits(Client, dgram.Socket);

Client.prototype.request = function (port, host) {
    var req = new ClientRequest(this, this, port, host);
    return req;
};

Client.prototype.defaultType = 'udp4';

Client.prototype.parser = parsers.alloc();


/****************
    Create client instance
****************/

var createClient = function () {
    var type = this.defaultType;
    var responseListener = null;

    if (typeof arguments[0] === 'string') {
        type = arguments[0];
        if (typeof arguments[1] === 'function') {
            responseListener = arguments[1];
        }
    } else if (typeof arguments[0] === 'function') {
       requestListener = arguments[0];
    }
    return new Client(type, responseListener);
};

module.exports = {
    createClient: createClient
};
