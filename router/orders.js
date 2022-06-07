const express = require('express');
const router = express.Router();
const ordersController = require('../controller/orders');


router.get('/searchOrder',ordersController.searchOrder)

module.exports = router;