'use strict';

var consts = require('./consts'),
    debug = require('./debug'),
    errno = require('./errno');


/****************
    DNS Response writer
****************/

var DNSWriter = function (buf, start, end) {
    if (arguments.length < 3) {
    	this.initialized = false;
    	return;
    }

    if (!(buf instanceof Buffer)) {
	   throw new Error('Argument should be a buffer');
    }

    if (start > end) {
	   throw new Error('Start extends beyond end');
    }

    if (start > buf.length) {
	   throw new Error('Offset is out of bounds');
    }

    if (end > buf.length) {
	   throw new Error('Length extends beyond buffer');
    }

    this.dnptrs = new Array(20);
    this.dnptrs[0] = null;
    this.lastdnptr = this.dnptrs.length;

    this.rdstart = 0;
    this.trstart = 0;

    this.buf = buf;
    this.bufStart = start;
    this.bufEnd = end;

    this.writeStart = 0;
    this.writeEnd = this.bufEnd;

    this.initialized = true;

    this.truncated = false;
};

DNSWriter.prototype.reinitialize = function () {
    DNSWriter.apply(this, arguments);
};

DNSWriter.prototype.startRdata = function () {
    if (this.truncated) {
	   return;
    }

    this.writeUInt16(0);
    this.rdstart = this.writeStart;
};

DNSWriter.prototype.endRdata = function () {
    if (this.truncated) {
	   return;
    }

    var rdlength = this.writeStart - this.rdstart;
    this.buf[this.rdstart - 2] = (rdlength >> 8) & 0xff;
    this.buf[this.rdstart - 1] = (rdlength) & 0xff;
};

DNSWriter.prototype.startTruncate = function () {
    if (this.truncated) {
	   return;
    }

    this.trstart = this.writeStart;
};

DNSWriter.prototype.endTruncate = function () {
    debug('DNSWriter.prototype.endTruncate');
    // todo: figure out truncate
    this.writeStart = this.trstart;
};

DNSWriter.prototype._cdname = new Buffer(consts.ns_maxcdname);

DNSWriter.prototype._dname = new Buffer(consts.ns_maxdname);

DNSWriter.prototype.writeNameBuffer = function (name) {
    if (this.truncated) {
	   return;
    }

    var n, len;

    if ((len = ns_name_pton(name, this._dname, this._dname.length)) == -1) {
    	if (errno.get() === 'EMSGSIZE') {
    	    this.truncated = true;
    	    return;
    	}
    	throw new Error('ns_name_pton');
    }

    if ((n = ns_name_pack(this._dname, this.buf, this.writeStart, this.writeEnd - this.writeStart, this.dnptrs, this.lastdnptr)) == -1) {
    	if (errno.get() === 'EMSGSIZE') {
    	    this.truncated = true;
    	    return;
    	}
    	throw new Error('ns_name_pack');
    }
    this.writeStart += n;
};

DNSWriter.prototype._string = new Buffer(consts.ns_maxdname);

DNSWriter.prototype.writeNameString = function (name) {
    if (this.truncated) {
	   return;
    }

    var len;
    // copy string to buffer
    len = this._string.write(name);

    if (len == this._string.length) {
	   throw new Error("Name string is too long");
    }

    this._string[len] = 0; // terminate string

    this.writeNameBuffer(this._string);
};

DNSWriter.prototype.writeName = function (name) {
    if (typeof name === 'string') {
	   this.writeNameString(name);
    } else if (name instanceof Buffer) {
	   this.writeNameBuffer(name);
    }
};

DNSWriter.prototype.writeUInt8 = function (uint) {
    if (this.truncated) {
	   return;
    }

    if (this.writeStart + 1 > this.writeEnd) {
	   this.truncated = true;
    } else {
	   this.buf[this.writeStart++] = (uint) & 0xff;
    }
};

DNSWriter.prototype.writeUInt16 = function (uint) {
    if (this.truncated) {
	   return;
    }

    if (this.writeStart + 2 > this.writeEnd) {
	   this.truncated = true;
    } else {
    	this.buf[this.writeStart++] = (uint >> 8) & 0xff;
    	this.buf[this.writeStart++] = (uint >> 0) & 0xff;
    }
};

DNSWriter.prototype.writeUInt32 = function (uint) {
    if (this.truncated) {
	   return;
    }

    if (this.writeStart + 4 > this.writeEnd) {
	   this.truncated = true;
    } else {
    	this.buf[this.writeStart++] = (uint >> 24) & 0xff;
    	this.buf[this.writeStart++] = (uint >> 16) & 0xff;
    	this.buf[this.writeStart++] = (uint >> 8) & 0xff;
    	this.buf[this.writeStart++] = (uint >> 0) & 0xff;
    }
};

DNSWriter.prototype.writeHeader = function (header) {
    var tmp = 0;
    tmp = 0;
    tmp |= (header.qr << 15) & 0x8000;
    tmp |= (header.opcode << 11) & 0x7800;
    tmp |= (header.aa << 10) & 0x0400;
    tmp |= (header.tc << 9) & 0x0200;
    tmp |= (header.rd << 8) & 0x0100;
    tmp |= (header.ra << 7) & 0x0080;
    tmp |= (header.z << 6) & 0x0040;
    tmp |= (header.ad << 5) & 0x0020;
    tmp |= (header.cd << 4) & 0x0010;
    tmp |= (header.rcode << 0) & 0x000f;

    this.writeUInt16(header.id);
    this.writeUInt16(tmp);
    this.writeUInt16(header.qdcount);
    this.writeUInt16(header.ancount);
    this.writeUInt16(header.nscount);
    this.writeUInt16(header.arcount);
};

DNSWriter.prototype.writeQuestion = function (question) {
    debug('DNSWriter.prototype.writeQuestion');
    this.writeName(question.name);
    this.writeUInt16(question.type);
    this.writeUInt16(question.class);
};

DNSWriter.prototype.writeBuffer = function (buf) {
    if (this.truncated) {
	   return;
    }

    if (this.writeStart + buf.length > this.writeEnd) {
	   this.truncated = true;
    } else {
    	buf.copy(this.buf, this.writeStart, 0, buf.length);
    	this.writeStart += buf.length;
    }
};

DNSWriter.prototype.writeString = function (str) {
    if (this.truncated) {
	   return;
    }

    if (this.writeString + Buffer.byteLength(str, 'ascii') > this.writeEnd) {
	   this.truncated = true;
    } else {
	   this.writeStart += this.buf.write(str, this.writeStart);
    }
};

DNSWriter.prototype.writeA = function (a) {
    var tmp;

    if (this.truncated) {
	   return;
    }

    if (this.writeStart + 4 > this.writeEnd) {
	   this.truncated = true;
    } else {
    	tmp = a.split('.');
    	this.buf[this.writeStart++] = tmp[0];
    	this.buf[this.writeStart++] = tmp[1];
    	this.buf[this.writeStart++] = tmp[2];
    	this.buf[this.writeStart++] = tmp[3];
    }
};

DNSWriter.prototype.writeSOA = function (soa) {
    debug('DNSWriter.prototype.writeSOA');
    
    this.writeName(soa[0]); // mname
    this.writeName(soa[1]); // rname
    this.writeUInt32(soa[2]); // serial
    this.writeUInt32(soa[3]); // refresh
    this.writeUInt32(soa[4]); // retry
    this.writeUInt32(soa[5]); // expire
    this.writeUInt32(soa[6]); // minumum
};

DNSWriter.prototype.writeMX = function (mx) {
    this.writeUInt16(mx[0]); // preference
    this.writeName(mx[1]); // exchange
};

DNSWriter.prototype.writeAAAA = function (aaaa) {
    if (this.truncated) {
	   return;
    }

    var n, tmp;

    if (this.writeStart + 16 > this.writeEnd) {
    	this.truncated = true;
    	return;
    }
    
    tmp = aaaa.split(':');
    if (tmp.length !== 8) {
	   throw new Error("IPV6 String must have exactly 7 colons");
    }

    for (var i = 0; i < 8; i++) {
	   this.writeUInt16(parseInt(tmp[i], 16));
    }
};

DNSWriter.prototype.writeRR = function (rr) {
    debug('DNSWriter.prototype.writeRR');

    this.writeName(rr.name);
    this.writeUInt16(rr.type);
    this.writeUInt16(rr.class);
    this.writeUInt32(rr.ttl);

    this.startRdata();

    if (rr.type == 1) { // a
	   this.writeA(rr.rdata[0]);
    } else if (rr.type == 2) { // ns
	   this.writeName(rr.rdata[0]);
    } else if (rr.type == 5) { // cname
	   this.writeName(rr.rdata[0]);
    } else if (rr.type == 6) { // soa
	   this.writeSOA(rr.rdata);
    } else if (rr.type == 12) { // ptr
	   this.writeName(rr.rdata[0]);
    } else if (rr.type == 15) { // mx
	   this.writeMX(rr.rdata);
    } else if (rr.type == 16) { // txt
    	this.writeUInt8(rr.rdata[0].length);

    	if (typeof rr.rdata[0] === 'string') {
    	    this.writeString(rr.rdata[0]);
        } else if (rr.rdata[0] instanceof Buffer) {
    	    this.writeBuffer(rr.rdata[0]);
        }
    } else if (rr.type == 28) { // aaaa
	   this.writeAAAA(rr.rdata[0]);
    } else {
    	if (typeof rr.rdata[0] === 'string') {
    	    this.writeString(rr.rdata[0]);
        } else if (rr.rdata[0] instanceof Buffer) {
    	    this.writeBuffer(rr.rdata[0]);
        }
    }

    this.endRdata();
};

DNSWriter.prototype.writeMessage = function (message) {
    this.writeHeader(message.header);

    for (var i = 0; i < message.q.length; i++) {
	   this.writeQuestion(message.q[i]);
    }

    this.startTruncate();

    for (var i = 0; i < message.rr.length; i++) {
	   this.writeRR(message.rr[i]);
    }

    if (this.truncated) {
	   this.endTruncate();
    }
};

module.exports = DNSWriter;
