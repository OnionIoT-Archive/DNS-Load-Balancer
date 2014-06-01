'use strict';

var util = require('util'), 
	dgram = require('dgram');

var debug = require('./debug');

var Server = function (type, requestListener) {
    dgram.Socket.call(this, type);
    if (requestListener) {
    	this.on('request', requestListener);
    }

    this.on('message', messageListener);
};

util.inherits(Server, dgram.Socket);

Server.prototype._Parser = parsers.alloc();

var messageListener = function (msg, rinfo) {
    var self = this;

    debug('new message');

    this._Parser.reinitialize(msg, 0, msg.length);
    this._Parser.socket = this;
    this._Parser.rinfo = rinfo;

    this._Parser.onIncoming = function (req) {
		var res = new ServerResponse(req);
		self.emit('request', req, res);
    };
    this._Parser.onError = debug;

    this._Parser.parseMessage();
};

module.exports = Server;