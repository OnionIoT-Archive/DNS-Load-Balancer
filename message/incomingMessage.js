function IncomingMessage (socket, rinfo) {
    Message.call(this, socket, rinfo);
};
sys.inherits(IncomingMessage, Message);
exports.IncomingMessage = IncomingMessage;