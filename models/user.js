'use strict';

var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var Q = require('q');

var conf = require('../conf');

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }
});

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        next();
        return;
    }

    Q.nfcall(bcrypt.hash, user.password, conf.get('db:hash-factor'))
        .then(function(hash) {
            user.password = hash;
            next();
        }).catch(next);
});

userSchema.methods.verifyPassword = function(passwd) {
    return bcrypt.compareSync(passwd, this.password);
};

module.exports = mongoose.model('User', userSchema);