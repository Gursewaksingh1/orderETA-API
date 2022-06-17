const express = require("express");
const deliveryController = require("../controller/delivery");
const router = express.Router();
const isAuth = require("../middleware/isAuth");
const {
  deliveryValidationRules,
  updateDeliveryValidationRules,
} = require("../validatorSchema/deliveryValidationRules");
const validate = require("../validatorSchema/validateMiddleware");

router.post(
  "/",
  isAuth,
  deliveryValidationRules(),
  validate,
  deliveryController.startDelivery
);
router.put(
  "/",
   isAuth,
  updateDeliveryValidationRules(),
  validate,
 
  deliveryController.updateDelivery
);
router.delete('/',isAuth,deliveryController.deleteDelivery)
module.exports = router;
