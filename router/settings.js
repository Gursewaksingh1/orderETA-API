const express = require("express");
const settingController = require("../controller/settings");
const router = express.Router();
const validate = require("../validatorSchema/validatemiddleware");
const { validateLanguage } = require("../validatorSchema/validationrules");

const isAuth = require("../middleware/isAuth");
router.put(
  "/language",
  isAuth,
  validateLanguage(),
  validate,
  settingController.updateLanguage
);
router.get("/language",isAuth,settingController.language);
module.exports = router;
