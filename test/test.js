var logwranglerSocket = require('../index');


//require('./testServer');

var options = {
	host: 'localhost',
	port: 9999,
	authenticated: true,
	authToken: 'LOLOLOL'
};

var handler = new logwranglerSocket.ws(options);
setTimeout(function(){
	var counter = 0;
	setInterval(function(){
		counter++;
		handler({ test: 'foo' }, { data: counter } );
	}, 100);

}, 2000);



