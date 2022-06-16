const express = require("express");
const userController = require("../controller/_User");
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");

const {
  driverLoginValidationRules,
  validate_driver_steps,
} = require("../validatorSchema/deliveryValidationRules");

const isAuth = require("../middleware/isAuth");

router.get("/",isAuth,userController.getUser)
router.post(
  "/login",
  driverLoginValidationRules(),
  validate,
  userController.login
);

router.post("/refreshtoken", userController.refreshToken);

router.post(
  "/driverSteps",
  isAuth,
  validate_driver_steps(),
  validate,
  userController
  .create_Driver_Steps_And_UpdateUser
);
module.exports = router;
