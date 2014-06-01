'use strict';



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

module.export = {
    createServer: createServer,
    createClient: createClient
};