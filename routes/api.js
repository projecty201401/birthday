'use strict';

var crypto = require('crypto');
var util = require('util');

var express = require('express');
var errors = require('mongoose').Error;
var passport = require('passport');
var Q = require('q');

var auth = require('../auth');
var conf = require('../conf');
var User = require('../models').User;

var router = express.Router();

var get = function(Model) {
    return function(req, res, next) {
        Q.when(Model.findById(req.params.id).exec())
            .then(function(instance) {
                if (!instance) {
                    res.send(404); // not found
                } else {
                    res.json(instance);
                }
            }).catch(next);
    };
};

var getAll = function(Model) {
    return function(req, res, next) {
        var limit = req.query.limit || 30; // TODO find a reasonable default value
        var skip = req.query.skip || 0;
        var query = req.query.player ? { player: req.query.player } : {};

        Q.when(Model.find(query).skip(skip).limit(limit).exec())
            .then(function(collection) {
                res.json(collection);
            }).catch(next);
    }
};

var add = function(Model) {
    return function(req, res, next) {
        var instance;
        var website = util.format('%s://%s', req.protocol, req.get('Host'));

        Q.when(Model.create(req.body))
            .then(function(_instance) {
                instance = _instance;

                if (Model === User) {

                    // do not transmit password and activation key over network
                    instance.password = undefined;
                    instance.activationKey = undefined;

                }

                res.location(util.format('%s%s/%s', website, req.originalUrl, instance._id));
                res.json(201, instance);
            }).catch(function(err) {
                // remove user if E-mail could not be sent
                if (Model === User && instance && instance._id) {
                    instance.remove();
                }

                next(err);
            });
    }
};

var update = function(Model) {
    return function(req, res, next) {
        Q.when(Model.findByIdAndUpdate(req.params.id, req.body).exec())
            .then(function() {
                res.send(204); // no content
            }).catch(next);
    }
};

var updateUser = function(req, res, next) {
    Q.when(User.findById(req.params.id).exec())
        .then(function(user) {
            // restrict update to self
            if (!user._id.equals(req.user._id)) {
                res.send(401); // unauthorized
                return;
            }

            // password updating is done in its own route
            delete req.body.password;

            return Q.when(user.update(req.body).exec());
        }).then(function() {
            if (!res.finished) {
                res.send(204); // no content
            }
        }).catch(next);
};

var remove = function(Model) {
    return function(req, res, next) {
        Q.when(Model.findByIdAndRemove(req.params.id).exec())
            .then(function() {
                res.send(204); // no content
            }).catch(next);
    }
};

var removeUser = function(req, res, next) {
    Q.when(User.findById(req.params.id).exec())
        .then(function(user) {
            if (!user._id.equals(req.user._id)) {
                res.send(401); // unauthorized
                return;
            }

            return Q.ninvoke(user, 'remove');
        }).then(function() {
            if (!res.finished) {
                res.send(204); // no content
            }
        }).catch(next);
};

var listMethods = function(methods) {
    return function(req, res) {
        res.writeHeader(405, { Allow: methods }); // method not allowed
        res.end();
    }
};

var errorHandler = function(err, req, res, next) {
    console.error(err);

    if (err instanceof errors.CastError) {
        res.send(400); // bad request TODO maybe use 404
    } else if (err instanceof errors.ValidationError) {
        res.json(400, err.errors); // bad request
    } else if (err.name === 'MongoError' && err.code === 11000) {
        res.send(409, 'duplicate key'); // conflict
    } else {
        next(err);
    }
};


/* route definitions */

router.post('/login', passport.authenticate('local'),
    function(req, res) {
        res.json(req.user);
});
router.post('/logout', auth.revokeAuth);
router.get('/ping', auth.check);

router.route('/user')
    .get(getAll(User))
    .post(add(User))
    .all(listMethods('GET POST'));
router.route('/user/:id')
    .get(get(User))
    .put(auth.restrict, updateUser)
    .delete(auth.restrict, removeUser)
    .all(listMethods('GET PUT DELETE'));

router.use(errorHandler);

module.exports = router;
