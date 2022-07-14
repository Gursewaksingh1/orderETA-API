const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders");
const isAuth = require("../middleware/isAuth")
const validate = require("../validatorSchema/validatemiddleware");
const {
  order,
  validateSeqNumber,
  validate_barCode
} = require("../validatorSchema/validationrules");

router.get("/",isAuth, ordersController.getOrders);

router.get("/byscan",isAuth, ordersController.get_orders_by_scan);

router.get(
  "/currentdate",
  isAuth,
  ordersController.getOrderByCurrentDate
);

router.get(
  "/:byseq",isAuth,validateSeqNumber(),validate,
  
  ordersController.getOrderBySeq
);

router.post("/confirmbarcode",isAuth,validate_barCode(),validate,ordersController.confirmBarCode)
router.post("/listorders",isAuth,order(),validate,ordersController.listOrders)

module.exports = router;
