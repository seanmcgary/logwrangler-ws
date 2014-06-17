var net = require('net');
var _ = require('lodash');
var async = require('async');

var Connection = function(connectionOptions){
	var connectionTimeout;
	var connected = false;
	var client;

	var createConnection = function(){
		clearTimeout(connectionTimeout);
		client = net.connect(connectionOptions, function(){
			console.log('Connection created');
			connected = true;
			clearTimeout(connectionTimeout);
		});
		client.setNoDelay(true);

		var handleError = function(err, from){
			connected = false;
			client.destroy();
			client = null;			
		};

		client.on('end', function(err){
			handleError(err, 'end');
		});
		client.on('error', function(err){
			handleError(err, 'error');
		});
		client.on('disconnect', function(err){
			handleError(err, 'disconnect');
		});

		connectionTimeout = setTimeout(function(){
			if(client){
				client.close();
				client.destroy();
			}
			client = null;
			createConnection();
		}, 2000);

	};

	createConnection();
	
	return {
		isConnected: function(){
			return connected;
		},
		getClient: function(){
			return client;
		}
	};
};

// takes a connection instance
var Queue = function(connection){
	var checkConnectionInterval;
	var baseConnectionCheckInterval = 1000;
	var intervalIncrement = 1000;
	var totalTimesChecked = 0;

	var q = async.queue(function(data, cb){
		var internalCb = function(err){
			if(err){
				q.pause();
				q.push(data);
				startConnectionChecker();
			}
			cb();
		};

		if(connection.isConnected()){
			try {
				connection.getClient().write(data + "\n", function(){
					internalCb();
				});
			} catch(e){
				internalCb(true);
			}
		} else {
			internalCb(true);
		}
	}, 1);

	var startConnectionChecker = function(interval){
		interval = interval || baseConnectionCheckInterval;

		setTimeout(function(){
			if(connection.isConnected()){
				clearInterval(checkConnectionInterval);
				q.resume();
				totalTimesChecked = 0;
			} else {
				if(totalTimesChecked == 5){
					interval += intervalIncrement;
					totalTimesChecked = 0;
				}
				totalTimesChecked++;
				startConnectionChecker(interval);
			}
		}, interval);
	};


	return {
		push: function(data){
			data = data || {};

			q.push(JSON.stringify(data));
		},
		length: function(){
			return q.length;
		}
	};
};

var logwranglerTcp = function(handlerOptions){
	handlerOptions = _.extend({
		host: 'localhost',
		port: 9999,
		delimiter: '\n'
	}, handlerOptions);

	
	var connection = new Connection(handlerOptions);
	var queue = new Queue(connection);
	
	return function(options, data){
		queue.push(data);
	};
};

module.exports = logwranglerTcp;