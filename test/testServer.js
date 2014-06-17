var http = require('http').Server();
var io = require('socket.io')(http);
io.serveClient(false);

io.on('connection', function(socket){
	console.log('client connected');

	socket.on('event', function(data){
		console.log('got message');
		console.log(data);
	});
});

io.listen(9999);