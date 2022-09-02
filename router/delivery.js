const express = require("express");
const deliveryController = require("../controller/delivery");
const router = express.Router();
const isAuth = require("../middleware/isAuth");
const {deliveryValidationRules} = require("../validatorSchema/validationrules");
const validate = require("../validatorSchema/validatemiddleware");
const { route } = require("./orders");

router.post(
  "/",
  isAuth,
  deliveryValidationRules(),
  validate,
  deliveryController.startDelivery
);

router.post("/cancelroute",isAuth,deliveryController.cancelRoute);
module.exports = router;
