'use strict';

var util = require('util'), 
	dgram = require('dgram');

var debug = require('./debug'),
    messages = require('./messages'),
    parsers = require('./parsers'),
    consts = require('./consts');


/****************
    Server response object
****************/

var ServerResponse = function (req) {
    OutgoingMessage.call(this, req.socket, req.rinfo);
};
util.inherits(ServerResponse, messages.OutgoingMessage);


/****************
    DNS Server object
****************/

var Server = function (type, requestListener) {
    dgram.Socket.call(this, type);
    if (requestListener) {
    	this.on('request', requestListener);
    }

    this.on('message', function (msg, rinfo) {
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
    });
};
util.inherits(Server, dgram.Socket);

Server.prototype._Parser = parsers.alloc();


/****************
    Create DNS server instance
****************/

var createServer = function () {
    var type = 'udp4';
    var requestListener = null;
    if (typeof arguments[0] === 'string') {
        type = arguments[0];
        if (typeof arguments[1] === 'function') {
            requestListener = arguments[1];
        }
    } else if (typeof arguments[0] === 'function') {
       requestListener = arguments[0];
    }

    return new Server(type, requestListener);
};

module.exports = {
    createServer: createServer
};
