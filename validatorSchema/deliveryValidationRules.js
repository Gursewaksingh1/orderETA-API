const { body } = require("express-validator");

const deliveryValidationRules = () => {
  return [
    body("orderId")
      .notEmpty()
      .withMessage("orderId must not be empty")
      .isNumeric()
      .withMessage("orderId must be a numberic"),
    body("boxId")
      .notEmpty()
      .withMessage("boxId must not be empty")
      .isNumeric()
      .withMessage("boxId must be a numberic"),
    body("startLatitude")
      .notEmpty()
      .withMessage("startLatitude must not be empty")
      .isDecimal()
      .withMessage("startLatitude must be a decimal number")
      .isFloat({ min: -90, max: 90 })
      .withMessage("startLatitude must be between -90 and 90"),

    body("startLongitude")
      .notEmpty()
      .withMessage("startLongitude must not be empty")
      .isDecimal()
      .withMessage("startLongitude must be a decimal number")
      .isFloat({ min: -180, max: 180 })
      .withMessage("startLatitude must be between -180 and 180"),

    body("endLatitude")
      .notEmpty()
      .withMessage("endLatitude must not be empty")
      .isDecimal()
      .withMessage("endLatitude must be a decimal number")
      .isFloat({ min: -90, max: 90 })
      .withMessage("endLatitude must be between -90 and 90"),

    body("endLongitude")
      .notEmpty()
      .withMessage("endLongitude must not be empty")
      .isDecimal()
      .withMessage("endLongitude must be a decimal number")
      .isFloat({ min: -180, max: 180 })
      .withMessage("endLongitude must be between -180 and 180"),
  ];
};

const updateDeliveryValidationRules = () => {
  return [
    body("endLatitude")
      .notEmpty()
      .withMessage("endLatitude must not be empty")
      .isDecimal()
      .withMessage("endLatitude must be a decimal number")
      .isFloat({ min: -90, max: 90 })
      .withMessage("endLatitude must be between -90 and 90"),

    body("endLongitude")
      .notEmpty()
      .withMessage("endLongitude must not be empty")
      .isDecimal()
      .withMessage("endLongitude must be a decimal number")
      .isFloat({ min: -180, max: 180 })
      .withMessage("endLongitude must be between -180 and 180"),
  ];
};
const driverLoginValidationRules = () => {
  return [
    body("username")
      .notEmpty()
      .withMessage("username must be a empty")
      .isString()
      .withMessage("username must be a string")
      .isLength({ min: 3, max: 30 })
      .withMessage("username must contain three characters"),
    body("password")
      .notEmpty()
      .withMessage("password must be empty")
      .isLength({ min: 6, max: 30 })
      .withMessage("password must contain six characters"),
  ];
};
module.exports = {
  deliveryValidationRules,
  updateDeliveryValidationRules,
  driverLoginValidationRules
};
