const express = require('express');
const driverController = require('../controller/drivers');
const router = express.Router();
const isAuth = require("../middleware/isAuth")
const driverLoginSchema = require('../validatorSchema/driver_login_validation')
const {body, checkSchema} = require('express-validator');

router.post('/login',checkSchema(driverLoginSchema), driverController.login)
router.post('/refreshtoken', driverController.refreshToken)

module.exports = router;
