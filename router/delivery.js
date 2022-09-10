const express = require("express");
const deliveryController = require("../controller/delivery");
const router = express.Router();
const isAuth = require("../middleware/isAuth");
const {
  deliveryValidationRules,
  smsManagerValidation,
  notifyManagerUserReturnValidation,returnOrder
} = require("../validatorSchema/validationrules");
const validate = require("../validatorSchema/validatemiddleware");

router.post(
  "/",
  isAuth,
  deliveryValidationRules(),
  validate,
  deliveryController.startDelivery
);
router.post(
  "/confirmBox",
  isAuth,
  deliveryController.confirmBoxAtStartDelivery
);
router.post("/cancelroute", isAuth, deliveryController.cancelRoute);
router.post("/scanbox", isAuth, deliveryController.scanOrderForBeginDelivery);
router.post(
  "/smsmanager",
  isAuth,
  smsManagerValidation(),
  validate,
  deliveryController.sendSmsOnStartDeliveryToManager
);
router.post(
  "/returnorder",
  isAuth,
  returnOrder(),
  validate,
  deliveryController.tableViewOptionAfterStartDelivery
);
router.post(
  "/cancelorder",
  isAuth,
  returnOrder(),
  validate,
  deliveryController.cancelOrdeAtCustomerPage
);
router.post(
  "/notifymanager",
  isAuth,
  notifyManagerUserReturnValidation(),
  validate,
  deliveryController.notifyManagerUserReturn
);
router.post(
  "/driverdoodle",
  isAuth,
  deliveryController.notifyDriverDoodleTime
);
module.exports = router;
