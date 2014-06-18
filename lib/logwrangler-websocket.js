var net = require('net');
var _ = require('lodash');
var async = require('async');
var ioClient = require('socket.io-client');

var Connection = function(connectionOptions){
	var connectionTimeout;
	var connected = false;
	var client;

	var createConnection = function(){
		clearTimeout(connectionTimeout);
		client = ioClient(['http://', [connectionOptions.host, connectionOptions.port].join(':')].join(''), {
			timeout: 5000,
			reconnection: true,
			reconnectionDelay: 1000
		});

		client.on('connect', function(){
			connected = true;
			clearTimeout(connectionTimeout);

			client.on('disconnect', function(err){
				handleError(err, 'error');
			});

			client.on('error', function(){
				handleError(err, 'error');
			});
			client.on('close', function(){
				handleError(err, 'close');
			});
			client.on('end', function(err){
				handleError(err, 'end');
			});
		});

		var handleError = function(err, from){
			connected = false;
		};

		connectionTimeout = setTimeout(function(){
			handleError();
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
				connection.getClient().send(data);
				internalCb();
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
				console.log('Reconnected');
				clearInterval(checkConnectionInterval);
				q.resume();
				totalTimesChecked = 0;
			} else {
				console.log('Connection still down');
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

			q.push(data);
		},
		length: function(){
			return q.length;
		}
	};
};

var logwranglerTcp = function(handlerOptions){
	handlerOptions = _.extend({
		host: 'localhost',
		port: 9999
	}, handlerOptions);

	
	var connection = new Connection(handlerOptions);
	var queue = new Queue(connection);
	
	return function(options, data){
		queue.push(data);
	};
};

module.exports = logwranglerTcp;