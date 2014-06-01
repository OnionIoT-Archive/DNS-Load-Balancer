'use strict';

var FreeList = require('freelist').FreeList;

var debug = require('../etc/debug'),
    constants = require('../etc/constants');


/****************
    Buffer Wrapper for parser
****************/

var BufferReference = function (buffer, start, end) {
    if (!(buffer instanceof Buffer)) {
       throw new Error('Argument should be a buffer');
    }

    if (start > end) {
       throw new Error('Start extends beyond end');
    }

    if (start > buffer.length) {
       throw new Error('Offset is out of bounds');
    }

    if (end > buffer.length) {
       throw new Error('Length extends beyond buffer');
    }

    this.buffer = buffer;
    this.start = start;
    this.end = end;
};

BufferReference.prototype.toString = function () {
    return this.buffer.toString('ascii', this.start, this.end);
};

BufferReference.prototype.toBuffer = function () {
    return this.buffer.slice(this.start, this.end);
};


/****************
    Record data
****************/

var Rdata = function () {};

Rdata.prototype.length = 0;


/****************
    DNS Parser object
****************/

var DNSParser = function (buf, start, end) {
    if (arguments.length < 3) {
    	this.initialized = false;
    	return;
    }

    if (!(buf instanceof Buffer)) {
	   throw new Error('Argument should be a buffer');
    }
    if (start > buf.length) {
	   throw new Error('Offset is out of bounds');
    }
    if (end > buf.length) {
	   throw new Error('Length extends beyond buffer');
    }

    this.buf = buf;
    this.bufStart = start;
    this.bufEnd = end;

    this.parseStart = 0;
    this.parseEnd = 0;

    this.initialized = true;
    this.err = false;
};

DNSParser.prototype.reinitialize = function () {
    DNSParser.apply(this, arguments);
};

DNSParser.prototype.parseMessage = function () {
    var qdcount, 
        ancount, 
        nscount, 
        arcount, 
        rrcount;

    // todo: streaming parser
    if (typeof this.onMessageBegin === 'function') {
        this.onMessageBegin ();
    }

    try {
	   this.skipHeader(this.onHeader);
    } catch (err) { 
        this.err = err; 
        return;
    }

    qdcount = this.buf[this.parseStart-8] * 256 + this.buf[this.parseStart-7];
    ancount = this.buf[this.parseStart-6] * 256 + this.buf[this.parseStart-5];
    nscount = this.buf[this.parseStart-4] * 256 + this.buf[this.parseStart-3];
    arcount = this.buf[this.parseStart-2] * 256 + this.buf[this.parseStart-1];
    rrcount = ancount + nscount + arcount;

    for (var i = 0; i < qdcount; i++) {
    	try {
    	    this.skipQuestion(this.onQuestion);
    	} catch (err) { 
            this.err = err;
            return;
        }
    }

    for (var i = 0; i < rrcount; i++) {
    	if (i == 0 && typeof this.onAnswerBegin === 'function') {
    	    this.onAnswerBegin();
        } else if (i == ancount && typeof this.onAuthorityBegin === 'function') {
    	    this.onAuthorityBegin();
        } else if (i == ancount + nscount && typeof this.onAdditionalBegin === 'function') {
    	    this.onAdditionalBegin();
        }

    	try {
    	    this.skipRR(this.onRR);
    	} catch (err) { 
            this.err = err; 
            return; 
        }
    }

    if (typeof this.onMessageComplete === 'function') {
        this.onMessageComplete();
    }
};

DNSParser.prototype.skipHeader = function (callback) {
    this.parseEnd = this.parseStart + ns_hfixedsz;
    if (this.parseEnd > this.bufEnd) {
	   throw new Error();
    }

    if (typeof callback === 'function') {
	   callback(this.buf, this.parseStart, this.parseEnd);
    }

    this.parseStart = this.parseEnd;
};

DNSParser.prototype.skipQuestion = function (callback) {
    var ptr = new Ptr(this.parseStart);
    if (ns_name_skip(this.buf, ptr, this.bufEnd) != 0)
	throw new Error();

    this.parseEnd = ptr.get() + ns_qfixedsz;
    if (this.parseEnd > this.bufEnd)
	throw new Error();
    
    if (typeof callback === 'function')
	callback (this.buf, this.parseStart, this.parseEnd);

    this.parseStart = this.parseEnd;
};

DNSParser.prototype.skipRR = function (callback) {
    var rrcount;
    var ptr = new Ptr(this.parseStart);

    if (ns_name_skip(this.buf, ptr, this.bufEnd) != 0)
	throw new Error();
    
    this.parseEnd = ptr.get() + ns_rrfixedsz;
    if (this.parseEnd > this.bufEnd)
	throw new Error();
    
    this.parseEnd += this.buf[this.parseEnd - 2] * 256 + this.buf[this.parseEnd - 1];
    if (this.parseEnd > this.bufEnd)
	throw new Error();

    if (typeof callback === 'function')
	callback (this.buf, this.parseStart, this.parseEnd);

    this.parseStart = this.parseEnd;
};

DNSParser.prototype._cdname = new Buffer(ns_maxcdname);

DNSParser.prototype._dname = new Buffer(ns_maxdname);

DNSParser.prototype._string = new Buffer(ns_maxdname);

DNSParser.prototype.parseName = function () {
    var n, len;

    if ((n = ns_name_unpack(this.buf, this.parseStart, this.parseEnd - this.parseStart, this._dname, this._dname.length)) == -1)
	throw new Error();
    if ((len = ns_name_ntop(this._dname, this._string, this._string.length)) == -1)
	throw new Error();

    this.parseStart += n;
    return this._string.toString('ascii', 0, len);
};

DNSParser.prototype.parseUInt8 = function () {
    if (this.parseStart + 1 > this.parseEnd)
	throw new Error();
    this.parseStart++;
    return this.buf[this.parseStart-1];
};

DNSParser.prototype.parseUInt16 = function () {
    if (this.parseStart + 2 > this.parseEnd)
	throw new Error();
    this.parseStart += 2;
    return this.buf[this.parseStart-2] * 256 + this.buf[this.parseStart-1];
};

DNSParser.prototype.parseUInt32 = function () {
    if (this.parseStart + 4 > this.parseEnd)
	throw new Error();
    this.parseStart += 4;
    return (this.buf[this.parseStart-4] * 16777216 +
	    this.buf[this.parseStart-3] * 65536 + 
	    this.buf[this.parseStart-2] * 256 +
	    this.buf[this.parseStart-1] );
};

DNSParser.prototype.parseHeader = function (header) {
    var tmp;
    header.id = this.parseUInt16();
    tmp = this.parseUInt16();
    header.qr = (tmp & 0x8000) >> 15;
    header.opcode = (tmp & 0x7800) >> 11;
    header.aa = (tmp & 0x0400) >> 10;
    header.tc = (tmp & 0x0200) >> 9;
    header.rd = (tmp & 0x0100) >> 8;
    header.ra = (tmp & 0x0080) >> 7;
    header.z = (tmp & 0x0040) >> 6;
    header.ad = (tmp & 0x0020) >> 5;
    header.cd = (tmp & 0x0010) >> 4;
    header.rcode = (tmp & 0x000f) >> 0;

    header.qdcount = this.parseUInt16();
    header.ancount = this.parseUInt16();
    header.nscount = this.parseUInt16();
    header.arcount = this.parseUInt16();
};

DNSParser.prototype.parseQuestion = function (question) {
    question.name = this.parseName();
    question.type = this.parseUInt16();
    question.class = this.parseUInt16();
    question.typeName = p_type_syms[question.type];
    question.className = p_class_syms[question.class];
};

DNSParser.prototype.parseA = function () {
    if (this.parseStart + 4 > this.parseEnd)
	throw new Error();
    this.parseStart += 4;
    return [this.buf[this.parseStart-4],
	    this.buf[this.parseStart-2],
	    this.buf[this.parseStart-1],
	    this.buf[this.parseStart-1]].join('.');
};

DNSParser.prototype.parseSOA = function (soa) {
    soa.mname = this.parseName();
    soa.rname = this.parseName();
    soa.serial = this.parseUInt32();
    soa.refresh = this.parseUInt32();
    soa.retry = this.parseUInt32();
    soa.expire = this.parseUInt32();
    soa.minimum = this.parseUInt32();

    soa[0] = soa.mname;
    soa[1] = soa.rname;
    soa[2] = soa.serial;
    soa[3] = soa.refresh;
    soa[4] = soa.retry;
    soa[5] = soa.expire;
    soa[6] = soa.minimum;
    soa.length = 7;

    return soa;
};

DNSParser.prototype.parseMX = function (mx) {
    mx.preference = this.parseUInt16();
    mx.exchange = this.parseName();

    mx[0] = mx.preference;
    mx[1] = mx.exchange;
    mx.length = 2;

    return mx;
};

DNSParser.prototype.parseAAAA = function () {
    if (this.parseStart + 16 > this.parseEnd)
    throw new Error();
    this.parseStart += 16;
    return [(hexvalue[this.buf[this.parseStart-16]]+
         hexvalue[this.buf[this.parseStart-15]]),
        (hexvalue[this.buf[this.parseStart-14]]+
         hexvalue[this.buf[this.parseStart-13]]),
        (hexvalue[this.buf[this.parseStart-12]]+
         hexvalue[this.buf[this.parseStart-11]]),
        (hexvalue[this.buf[this.parseStart-10]]+
         hexvalue[this.buf[this.parseStart-9]]),
        (hexvalue[this.buf[this.parseStart-8]]+
         hexvalue[this.buf[this.parseStart-7]]),
        (hexvalue[this.buf[this.parseStart-6]]+
         hexvalue[this.buf[this.parseStart-5]]),
        (hexvalue[this.buf[this.parseStart-4]]+
         hexvalue[this.buf[this.parseStart-3]]),
        (hexvalue[this.buf[this.parseStart-2]]+
         hexvalue[this.buf[this.parseStart-1]])].join(":");
}

DNSParser.prototype.parseNSEC = function (nsec) {
    nsec.next_domain_name = this.parseName();
    nsec.type_bit_maps = new BufferReference (this.buf, this.parseStart, this.parseEnd);

    nsec[0] = nsec.next_domain_name;
    nsec[1] = nsec.type_bit_maps;
    nsec.length = 2;

    this.parseStart = this.parseEnd;
};

DNSParser.prototype.parseRR = function (rr) {
    var parseEnd;
    rr.name = this.parseName();
    rr.type = this.parseUInt16();
    rr.class = this.parseUInt16();
    rr.ttl = this.parseUInt32();
    rr.rdlength = this.parseUInt16();

    rr.typeName = p_type_syms[rr.type];
    rr.className = p_class_syms[rr.class];

    if (this.parseStart + rr.rdlength != this.parseEnd)
    throw new Error();

    rr.rdata = new Rdata();
    rr.rdata.length = 1;

    switch (rr.type) {
    case 1: // a
    rr.rdata.a = this.parseA();
    rr.rdata[0] = rr.rdata.a;
    break;
    case 2: // ns
    rr.rdata.ns = this.parseName();
    rr.rdata[0] = rr.rdata.ns;
    break;
    case 5: // cname
    rr.rdata.cname = this.parseName();
    rr.rdata[0] = rr.rdata.cname;
    break;
    case 6: // soa
    this.parseSOA(rr.rdata);
    break;
    case 12: // ptr
    rr.rdata.ptrdname = this.parseName();
    rr.rdata[0] = rr.rdata.ptrdname;
    break;
    case 15: // mx
    this.parseMX(rr.rdata);
    break;
    case 16: // txt
    rr.rdata.txt = new BufferReference (this.buf, this.parseStart, this.parseEnd);
    //rr.rdata.txt = this.buf.slice(this.parseStart, this.parseEnd);
    rr.rdata[0] = rr.rdata.txt;
    this.parseStart += rr.rdlength;
    break;
    case 28: // aaaa
    rr.rdata.aaaa = this.parseAAAA();
    rr.rdata[0] = rr.rdata.aaaa;
    break;
    case 47: // nsec
    this.parseNSEC(rr.rdata);
    break;
    default:
    rr.rdata = new BufferReference(this.parseStart, this.parseEnd);
    break;
    }

    if (this.parseStart != this.parseEnd)
    throw new Error();
};

DNSParser.prototype.finish = function () {
    if (arguments.length == 3 && (arguments[0] instanceof Buffer)) {
        this.parseOnce.apply(this, arguments);
    }
};


/****************
    Freelist of DNS parsers
****************/

var parsers = new FreeList('parsers', 1000, function () {
    var parser = new DNSParser();

    parser.onMessageBegin = function () {
        debug('parser.onMessageBegin');

        parser.incoming = new IncomingMessage(parser.socket, parser.rinfo);
    }

    parser.onHeader = function () {
        debug('parser.onHeader');

        try {
            parser.parseHeader(parser.incoming.header);
        } catch (err) { 
            parser.onError (err);
        }
    };

    parser.onQuestion = function () {
        debug('parser.onQuestion');

        try {
            parser.parseQuestion(parser.incoming.q.add());
        } catch (err) { 
            parser.onError (err);
        }
    };

    parser.onAnswerBegin = function () {
        debug('parser.onAnswerBegin');
    };

    parser.onAuthorityBegin = function () {
        debug('parser.onAuthorityBegin');
    };

    parser.onAdditionalBegin = function () {
        debug('parser.onAdditionalBegin');
    };

    parser.onRR = function () {
        debug('parser.onRR');

        try {
            parser.parseRR(parser.incoming.rr.add());
        } catch (err) { 
            parser.onError (err); 
        }
    };

    parser.onMessageComplete = function () {
        debug('parser.onMessageComplete');

        parser.onIncoming(parser.incoming);
    };

    return parser;
});

module.exports = parsers;