'use strict';

var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookies = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var passport = require('passport');
var csrf = require('csurf');

var conf = require('./conf');
var routes = require('./routes');

var sessionOptions = {
    secret: conf.get('server:session-secret'),
    proxy: conf.get('server:trust-proxy'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * conf.get('server:session-timeout'),
        secure: conf.get('server:secure-cookie')
    }
};

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookies());
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf());
app.use(csrfCookie);
app.use('/', routes);

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.listen(conf.get('server:port'), function() {
    console.log('Express server listening on port ' + this.address().port);
});

module.exports = app;

/*
 * put CSRF token in cookie and make it accessible for javascript
 * AngularJS will then automatically use it in the headers
 */
function csrfCookie(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false });
    next();
}
