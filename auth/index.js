'use strict';

var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var Q = require('q');

var User = require('../models').User;

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, done);
});

passport.use(new LocalStrategy(function(username, password, done) {
    Q.when(User.findOne({ username: username }).select('+password').exec())
        .then(function(user) {
            if (!user || !user.verifyPassword(password)) {
                done(false);
            } else {
                // do not transmit hashes over network
                user.password = undefined;
                done(null, user);
            }
        }).catch(done);
}));


/* express middleware */

function revokeAuth(req, res) {
    req.logout();
    res.send(204); // no content
}

function check(req, res) {
    // disable caching

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);

    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.send(204);
    }
}

function restrict(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.send(401); // unauthorized
    }
}

module.exports.revokeAuth = revokeAuth;
module.exports.check = check;
module.exports.restrict = restrict;