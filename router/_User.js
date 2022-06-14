const express = require("express");
const userController = require("../controller/_User");
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");
const {
  driverLoginValidationRules,
  orders,
  order,
  validateSeqNumber
} = require("../validatorSchema/deliveryValidationRules");
const isAuth = require("../middleware/isAuth");

router.get("/orders", orders(),
validate, isAuth, userController.getOrders);

router.get(
  "/orders/currentDate",
  isAuth,
  userController.getOrderByCurrentDate
);

router.get(
  "/orders/:orderId", order(),
  validate,
  isAuth,
  userController.getOrderByOrderId
);

router.get(
  "/orders/:Seq",validateSeqNumber(),validate,
  isAuth,
  userController.getOrderBySeq
);

router.post(
  "/login",
  driverLoginValidationRules(),
  validate,
  userController.login
);

router.post("/refreshtoken", orders(), validate, userController.refreshToken);

module.exports = router;
