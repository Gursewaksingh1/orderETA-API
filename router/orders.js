const express = require('express');
const router = express.Router();
const ordersController = require('../controller/orders');
const isAuth = require("../middleware/isAuth")

router.get('/searchOrder',isAuth,ordersController.searchOrder)
router.post('/listOrders',isAuth,ordersController.listOrders)

module.exports = router;
