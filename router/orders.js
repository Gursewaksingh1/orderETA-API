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
router.post("/test",ordersController.addOrdersForTest)
router.get("/byscan", isAuth, ordersController.get_orders_by_scan);
router.put("/",isAuth, ordersController.updateOrder);
router.get("/currentdate", isAuth, ordersController.getOrderByCurrentDate);
router.put("/scanbarcode", isAuth, ordersController.scanOrderBox);
router.post(
  "/confirmbarcode",
  isAuth,
  validate_barCode(),
  validate,
  ordersController.confirmBarCode
);
router.put(
  "/resetorder",
  isAuth,
  order(),
  validate,
  ordersController.resetOrder
);

router.put(
  "/manullyconfirm",
  isAuth,
  validate_reason_for_manully_confirm_order(),
  validate,
  ordersController.manullyConfirmOrder
);
router.delete(
  "/",
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

router.get(
  "/get/:orderId",
  isAuth,
  // validateSeqNumber(),
  // validate,

  ordersController.getOrderByOrderId
);

module.exports = router;
