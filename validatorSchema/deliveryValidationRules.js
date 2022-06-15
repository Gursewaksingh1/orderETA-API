const { body, check } = require("express-validator");

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

const orders = () => {
  return [
    check("page")
      .isFloat({ min: 1, max: 100000 })
      .withMessage("page number must be greater then natural number"),
  ];
};

const order = () => {
  return [check("orderId").notEmpty().withMessage("orderId must be empty")];
};

const validateSeqNumber = () => {
  return [
    check("Seq")
      .notEmpty()
      .withMessage("Seq must be empty")
      .isDecimal()
      .withMessage("Seq nust be a number"),
  ];
};

const validate_driver_steps = () => {
  return [
    body("route_started")
      .notEmpty()
      .withMessage("route started must not be empty")
      .isDate()
      .withMessage("route started field must be in (yyyy-mm-dd) format"),
    body("longitude")
      .notEmpty()
      .withMessage("longitude must not be empty")
      .isDecimal()
      .withMessage("longitude must be a number")
      .isFloat({ min: -180, max: 180 })
      .withMessage("longitude must be between -180 and 180"),
    body("latitude")
      .notEmpty()
      .withMessage("latitude must not be empty")
      .isDecimal()
      .withMessage("latitude must be a number")
      .isFloat({ min: -90, max: 90 })
      .withMessage("longitude must be between -90 and 90"),
    body("step_string")
      .notEmpty()
      .withMessage("step_string msut not empty")
      .isString()
      .withMessage("step_string should be a string"),
    body("step_type")
      .notEmpty()
      .withMessage("step_type must not be empty")
      .isNumeric()
      .withMessage("step_type must be a number"),
  ];
};
module.exports = {
  deliveryValidationRules,
  updateDeliveryValidationRules,
  driverLoginValidationRules,
  orders,
  order,
  validateSeqNumber,
  validate_driver_steps
};
