const { body, validationResult } = require('express-validator')
const User = require("../model/_User");
const validate = async(req, res, next) => {
  const user = await User.findOne({ _id: req.user.userId });
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const extractedErrors = []
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
    if (user.Language == 1) {
      return res.status(422).json({
        status:"failed",
        statusCode: 422,
        error: extractedErrors,
      })
    } else if (user.Language == 2) {
      return res.status(422).json({
        status:"ha fallado",
        statusCode: 422,
        error: extractedErrors,
      })
    } 
        
     
    
  }
  
  module.exports = validate