const express = require("express");
const userController = require("../controller/user");
const router = express.Router();
const validate = require("../validatorSchema/validatemiddleware");
const {
  driverLoginValidationRules,
  validate_driver_actions,
  validate_user_image,
  update_user_stops,
  validatedebug_temp,
  validate_logged_routing_request
} = require("../validatorSchema/validationrules");

const isAuth = require("../middleware/isAuth");

router.get("/userdetails", isAuth, userController.getUser);

router.put(
  "/update_user_stops",
  isAuth,
  update_user_stops(),
  validate,
  userController.updateUser
);
router.post("/debugtemp",isAuth,validatedebug_temp(),validate,userController.debug_temp)
router.get("/reason", isAuth, userController.getReason);
//router.get("/hereinf", isAuth, userController.getHereInf);
router.post("/loggedroutingrequest", isAuth, validate_logged_routing_request(),validate, userController.post_Logged_routing_request);
router.get("/store", isAuth, userController.get_store_of_logined_user);
router.post(
  "/userAction",
  isAuth,
  validate_driver_actions(),
  validate,
  userController.user_actions
);
router.post(
  "/userImage",
  isAuth,
  validate_user_image(),
  validate,
  userController.add_user_image
);
router.get(
  "/chnageuser",
  isAuth,
  userController.loadView
);
router.post("/login", driverLoginValidationRules(), userController.login);
router.post("/logout", isAuth, userController.logout);
router.put("/refreshtoken", userController.refreshToken);

module.exports = router;
