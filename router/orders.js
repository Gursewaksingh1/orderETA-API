const express = require('express');
const router = express.Router();
const ordersController = require('../controller/orders');
const isAuth = require("../middleware/isAuth")
const validate = require("../validatorSchema/validateMiddleware");
const {
  orders,
  order,
  validateSeqNumber,
  validate_barCode
} = require("../validatorSchema/deliveryValidationRules");

router.get("/orders",isAuth, orders(),
validate,  ordersController.getOrders);

router.get(
  "/orders/currentDate",
  isAuth,
  ordersController.getOrderByCurrentDate
);

router.get(
  "/order/:orderId",isAuth, order(),
  validate,
  
  ordersController.getOrderByOrderId
);

router.get(
  "/orders/:Seq",isAuth,validateSeqNumber(),validate,
  
  ordersController.getOrderBySeq
);

router.post("/confirmBarCode",isAuth,validate_barCode(),validate,ordersController.confirmBarCode)
router.post('/listOrders',isAuth,order(),validate,ordersController.listOrders)

module.exports = router;
