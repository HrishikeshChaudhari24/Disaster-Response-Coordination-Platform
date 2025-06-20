const express = require('express');
const router = express.Router();
const { geocodeLocation } = require('../controllers/geocodeController');

router.post('/', geocodeLocation);

module.exports = router;
