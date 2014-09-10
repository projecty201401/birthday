'use strict';

var path = require('path');
var express = require('express');

var api = require('./api');

var router = express.Router();

router.use('/api/v1', api);
router.use('/', express.static(path.resolve(__dirname, '../public')));

module.exports = router;
