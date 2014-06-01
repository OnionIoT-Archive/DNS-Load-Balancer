function ServerResponse (req) {
    OutgoingMessage.call(this, req.socket, req.rinfo);
}
sys.inherits(ServerResponse, OutgoingMessage);
exports.ServerResponse = ServerResponse;