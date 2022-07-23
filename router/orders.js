const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders");
const isAuth = require("../middleware/isAuth");
const validate = require("../validatorSchema/validatemiddleware");
const {
  order,
  validateSeqNumber,
  validate_barCode,
  validate_reason_for_manully_confirm_order
} = require("../validatorSchema/validationrules");

router.get("/", isAuth, ordersController.getOrders);

router.get("/byscan", isAuth, ordersController.get_orders_by_scan);

router.get("/currentdate", isAuth, ordersController.getOrderByCurrentDate);
router.get("/scanbarcode", isAuth, ordersController.scanOrderBox);
router.post(
  "/confirmbarcode",
  isAuth,
  validate_barCode(),
  validate,
  ordersController.confirmBarCode
);
router.post(
  "/listorders",
  isAuth,
  order(),
  validate,
  ordersController.listOrders
);

router.put(
  "/manullyconfirm",
  isAuth,
  validate_reason_for_manully_confirm_order(),
  validate,
  ordersController.manullyConfirmOrder
);
router.put(
  "/deleteorder",
  isAuth,
  order(),
  validate,
  ordersController.deleteOrder
);
router.get(
  "/:byseq",
  isAuth,
  validateSeqNumber(),
  validate,

  ordersController.getOrderBySeq
);
module.exports = router;
