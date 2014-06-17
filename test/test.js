var logwranglerSocket = require('../index');

//require('./testServer');

var options = {
	host: 'localhost',
	port: 9999
};

var handler = new logwranglerSocket.websocket(options);
setTimeout(function(){
	var counter = 0;
	setInterval(function(){
		counter++;
		handler({ test: 'foo' }, { data: counter } );
	}, 100);

}, 2000);

