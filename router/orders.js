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

router.get("/orders", orders(),
validate, isAuth, ordersController.getOrders);

router.get(
  "/orders/currentDate",
  isAuth,
  ordersController.getOrderByCurrentDate
);

router.get(
  "/order/:orderId", order(),
  validate,
  isAuth,
  ordersController.getOrderByOrderId
);

router.get(
  "/orders/:Seq",validateSeqNumber(),validate,
  isAuth,
  ordersController.getOrderBySeq
);

router.post("/confirmBarCode",isAuth,validate_barCode(),validate,ordersController.confirmBarCode)
router.get('/searchOrder',isAuth,ordersController.searchOrder)
router.post('/listOrders',validate,isAuth,ordersController.listOrders)

module.exports = router;
