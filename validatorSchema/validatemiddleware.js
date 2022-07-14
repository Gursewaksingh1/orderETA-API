const { body, validationResult } = require('express-validator')
const User = require("../model/user");
const validate = async(req, res, next) => {
  const user = await User.findOne({ _id: req.user.userId });
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const extractedErrors = []
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
      return res.status(422).json({
        status: user.Language == 1 ? "failed" : "ha fallado",
        statusCode: 422,
        error: extractedErrors,
      })
  }
  
  module.exports = validate
