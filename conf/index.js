'use strict';

var path = require('path');
var nconf = require('nconf');
var argv = require('optimist').argv;
var defaults = require('./defaults');

var confFile = argv.conf || process.env.NODE_CONFIGFILE || path.resolve(__dirname, '../conf.ini');

var fileArgs = {
    file: confFile,
    format: path.extname(confFile) === '.ini' ? nconf.formats.ini : nconf.formats.json
};

nconf
    .argv()
    .env('_')
    .file(fileArgs)
    .defaults(defaults);

// override some options with heroku specific ones
// TODO find a better way for this
if (process.env.PORT) {
    nconf.set('server:port', process.env.PORT);
}
if (process.env.MONGOLAB_URI) {
    nconf.set('db:uri', process.env.MONGOLAB_URI)
}

module.exports = nconf;