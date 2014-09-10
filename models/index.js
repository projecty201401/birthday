'use strict';

var mongoose = require('mongoose');
var conf = require('../conf');

var dbUri = conf.get('db:uri');
var options = {
    server: {
        socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
        auto_reconnect: true
    }
};

console.info('Connecting to %s', dbUri);
mongoose.connect(dbUri, options);

mongoose.connection.on('open', function() {
    console.info('Connection opened to mongodb at %s', dbUri);
});
mongoose.connection.on('error', function(err) {
    console.error('connection error:', err);
});

module.exports.User = require('./user');