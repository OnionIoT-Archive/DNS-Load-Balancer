'use strict';

var util = require('util'),
	events = require('events');

var consts = require('./consts'),
    debug = require('./debug'),
    DNSWriter = require('./writer');

/****************
    Message Header
****************/

var MessageHeader = function () {};

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
    for (var k in obj) {
		this[k] = obj[k];
    }
};


/****************
    Message Record
****************/

var MessageRecord = function () {};

MessageRecord.prototype.set = MessageHeader.prototype.set;


/****************
    Message Object
****************/

var MessageObject = function () {
    this.length = 0;
};

MessageObject.prototype.add = function () {
    var obj = this[this.length++] = new MessageRecord();

    if (arguments.length > 0) {
		obj.set(arguments[0]);
    }

    return obj;
};


/****************
    Message Superclass
****************/

var Message = function (socket, rinfo) {
    events.EventEmitter.call(this);

    this.socket = socket;
    this.rinfo = rinfo;

    this.length = 0;
    this.header = new MessageHeader();
    this.q = new MessageObject();
    this.rr = new MessageObject();
};

util.inherits(Message, events.EventEmitter);

var n_type_syms = {};
for (var k in consts.p_type_syms) {
    n_type_syms[consts.p_type_syms[k]] = k;
}

var n_class_syms = {};
for (var k in consts.p_class_syms) {
    n_class_syms[consts.p_class_syms[k]] = k;
}

Message.prototype.addRR = function (name, ttl, className, typeName) {
    if (arguments.length >= 4) {
		if (n_type_syms.hasOwnProperty(typeName.toUpperCase()) && n_class_syms.hasOwnProperty(className.toUpperCase())) {
		    var rr = this.rr.add();
		    rr.name = name;
		    rr.ttl = ttl
		    rr.type = n_type_syms[typeName.toUpperCase()];
		    rr.class = n_class_syms[className.toUpperCase()];
		    rr.rdata = Array.prototype.slice.call(arguments, 4);
		    return rr;
		}
    }
};

Message.prototype.setHeader = function (obj) {
    for (k in obj) {
		this.header[k] = obj[k];
    }
};

Message.prototype.addQuestion = function (name, typeName, className) {
    var question;
    if (arguments.length == 1 && typeof arguments[0] === 'object') {
		this.q.add(arguments[0]);
    } else {
		if (typeof name !== 'string' && !(name instanceof Buffer)) {
		    throw new Error ('Name argument should be string or buffer');
		}
		if (n_type_syms.hasOwnProperty(typeName.toUpperCase()) && n_class_syms.hasOwnProperty(className.toUpperCase())) {
		    question = this.q.add();
		    question.name = name;
		    question.type = n_type_syms[typeName.toUpperCase()];
		    question.class = n_class_syms[className.toUpperCase()];
		}
    }
};


/****************
    Incoming Messages
****************/

var IncomingMessage = function (socket, rinfo) {
    Message.call(this, socket, rinfo);
};
util.inherits(IncomingMessage, Message);


/****************
    Outgoing Messages
****************/

var OutgoingMessage = function (socket, rinfo) {
    Message.call(this, socket, rinfo);
    this.maxSend = 512;
};
util.inherits(OutgoingMessage, Message);

OutgoingMessage.prototype._Buffer = new Buffer(consts.ns_maxmsg);

OutgoingMessage.prototype._Writer = new DNSWriter();

OutgoingMessage.prototype.setMaxSend = function (n) {
    if (n > ns_maxmsg) {
        throw new Error ('Size must be < 65535');
    }

    this.maxSend = n;
};

OutgoingMessage.prototype.send = function (message) {
    debug('ServerResponse.prototype.send');

    if (arguments.length === 0) {
        message = this;
    }

    this._Writer.reinitialize (this._Buffer, 0, Math.min(this.maxSend, this._Buffer.length));

    this._Writer.writeMessage(message);

    this.socket.send(this._Buffer, 0, this._Writer.writeStart, this.rinfo.port, this.rinfo.address, function (err, bytesSent) {
        debug (err || 'bytesSent: ' + bytesSent);
    });
};

module.exports = {
    IncomingMessage: IncomingMessage,
    OutgoingMessage: OutgoingMessage
};
