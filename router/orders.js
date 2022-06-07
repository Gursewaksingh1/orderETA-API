const express = require('express');
const router = express.Router();
const ordersController = require('../controller/orders');


router.get('/searchOrder',ordersController.searchOrder)
router.post('/listOrders',ordersController.listOrders)

module.exports = router;
