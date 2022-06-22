const express = require("express");
const deliveryController = require("../controller/delivery");
const router = express.Router();
const isAuth = require("../middleware/isAuth");
const {deliveryValidationRules} = require("../validatorSchema/deliveryValidationRules");
const validate = require("../validatorSchema/validateMiddleware");

router.post(
  "/",
  isAuth,
  deliveryValidationRules(),
  validate,
  deliveryController.startDelivery
);

module.exports = router;
