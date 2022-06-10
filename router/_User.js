const express = require('express');
const userController = require('../controller/_User');
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");
const {driverLoginValidationRules} = require("../validatorSchema/deliveryValidationRules");


router.post('/login',driverLoginValidationRules(),validate, userController.login)
//router.post('/login', userController.login)

router.post('/refreshtoken', userController.refreshToken)

module.exports = router;
