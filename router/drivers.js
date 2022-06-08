const express = require('express');
const driverController = require('../controller/drivers');
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");
const {driverLoginValidationRules} = require("../validatorSchema/deliveryValidationRules");


router.post('/login',driverLoginValidationRules(),validate, driverController.login)
router.post('/refreshtoken', driverController.refreshToken)

module.exports = router;
