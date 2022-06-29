const express = require("express");
const userController = require("../controller/_User");
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");

const {
  driverLoginValidationRules,
  validate_driver_actions,validate_user_image
} = require("../validatorSchema/deliveryValidationRules");

const isAuth = require("../middleware/isAuth");

router.get("/", isAuth, userController.getUser);
router.get("/getStore",isAuth,userController.get_store_of_logined_user)
router.post(
  "/userAction",
  isAuth,
  validate_driver_actions(),
  validate,
  userController.user_actions
);
router.post("/userImage",isAuth,validate_user_image(),validate, userController.add_user_image)
router.post(
  "/login",
  driverLoginValidationRules(),
  validate,
  userController.login
);
router.post("/logout",isAuth, userController.logout);
router.post("/refreshtoken", userController.refreshToken);

module.exports = router;
