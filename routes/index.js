const express = require('express');
const router = express.Router();
require('dotenv').config();

const crawler = require('./crawler');

router.use('/crawler', crawler);

module.exports = router;
