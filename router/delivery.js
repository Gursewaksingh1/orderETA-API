const express = require("express");
const deliveryController = require("../controller/delivery");
const router = express.Router();
const isAuth = require("../middleware/isAuth");
const {deliveryValidationRules} = require("../validatorSchema/validationrules");
const validate = require("../validatorSchema/validatemiddleware");

router.post(
  "/",
  isAuth,
  // deliveryValidationRules(),
  // validate,
  deliveryController.startDelivery
);

module.exports = router;
