function Message (socket, rinfo) {
    events.EventEmitter.call(this);

    this.socket = socket;
    this.rinfo = rinfo;

    this.length = 0;
    this.header = new MessageHeader();
    this.q = new MessageObject();
    this.rr = new MessageObject();
}
sys.inherits(Message, events.EventEmitter);
exports.Message = Message;

Message.prototype.addRR = function (name, ttl, className, typeName) {
    if (arguments.length >= 4) {
	if (n_type_syms.hasOwnProperty(typeName.toUpperCase()) &&
	    n_class_syms.hasOwnProperty(className.toUpperCase())) {
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
    for (k in obj)
	this.header[k] = obj[k];
};

Message.prototype.addQuestion = function (name, typeName, className) {
    var question;
    if (arguments.length == 1 && typeof arguments[0] === 'object') {
	this.q.add(arguments[0]);
    }
    else {
	if (typeof name !== 'string' &&
	    !(name instanceof Buffer)) {
	    throw new Error ("Name argument should be string or buffer")
	}
	if (n_type_syms.hasOwnProperty(typeName.toUpperCase()) &&
	    n_class_syms.hasOwnProperty(className.toUpperCase())) {
	    question = this.q.add();
	    question.name = name;
	    question.type = n_type_syms[typeName.toUpperCase()];
	    question.class = n_class_syms[className.toUpperCase()];
	}
    }
};