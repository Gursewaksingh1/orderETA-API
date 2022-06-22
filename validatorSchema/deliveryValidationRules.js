const { body, check } = require("express-validator");
const User = require("../model/_User");


function customVerify(val,userObj,datatype,datatype_spanish,fieldName,) {
  if(val ==undefined || val.length ==0 || typeof val !=datatype) {
    if(userObj.Language ==1) {
      throw Error(`${fieldName} must not be empty and it should be ${datatype}`)
    } else if (userObj.Language ==2) {
      throw Error(`${fieldName} no debe estar vacío y debe ser una ${datatype_spanish}`)
    } else {
      throw Error(`${fieldName} must not be empty and it should be ${datatype}`)
    }
    
  }
}
function customVerifyLength(val,userObj,minLen,errorMsg,errorMsg_spanish) {
  if(val < minLen) {
    if(userObj.Language ==1) {
      throw Error(`${errorMsg}`)
    } else if (userObj.Language ==2) {
      throw Error(`${errorMsg_spanish}`)
    } else {
      throw Error(`${errorMsg}`)
    }
    
  }
}
const deliveryValidationRules = () => {
  return [
    body("step_string")
    .custom(async (stepString , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(stepString,user,"string","cadena","step_string")
      return stepString
    }),
    body("startLatitude")
    .custom(async (startLatitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(startLatitude,user,"number","número","startLatitude")
      return startLatitude
    }),
    body("startLongitude")
    .custom(async (startLongitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(startLongitude,user,"number","número","startLongitude")
      return startLongitude
    }),
    body("endLatitude")
    .custom(async (endLatitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(endLatitude,user,"number","número","endLatitude")
      return endLatitude
    }),
    body("endLongitude")
    .custom(async (endLongitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(endLongitude,user,"number","número","endLongitude")
      return endLongitude
    }),
  ];
};

const updateDeliveryValidationRules = () => {
  return [
    body("endLatitude")
    .custom(async (endLatitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(endLatitude,user,"number","número","endLatitude")
      return endLatitude
    }),
    body("endLongitude")
    .custom(async (endLongitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(endLongitude,user,"number","número","endLongitude")
      return endLongitude
    }),
  ];
};
const driverLoginValidationRules = () => {
  return [
    body("username")
      .notEmpty()
      .withMessage("username must be not empty")
      .isString()
      .withMessage("username must be a string")
      .isLength({ min: 3, max: 30 })
      .withMessage("username must contain atleast three characters"),
    body("password")
      .notEmpty()
      .withMessage("password must be not empty")
      .isLength({ min: 6, max: 30 })
      .withMessage("password must contain atleast six characters"),
  ];
};

const validation_list_order = () => {
  return [
    body("orderId")
    .custom(async (orderId , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerifyLength(orderId,user,1,"orderId must not be empty","orderId No debe estar vacía")
      
      return orderId
    }),
  ];
};
const orders = () => {
  return [
    
     check("page")
    
     .custom(async (page , { req })=> {
      
      const user = await User.findOne({_id:req.user.userId})
      customVerifyLength(page,user,1,"page number must be natural number","page número debe ser número natural")
      return page
     }),
  ];
};

const order = () => {
  return [check("orderId") .custom(async (orderId , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    customVerifyLength(orderId,user,1,"orderId must not be empty","orderId No debe estar vacía")
    
    return orderId
  })];
};

const validateSeqNumber = () => {
  return [
    check("Seq")
    .custom(async (Seq , { req })=> {
      var reg = /^\d+$/;  //checking if string only contains number or not 
      const user = await User.findOne({_id:req.user.userId})
      if(Seq ==undefined || Seq.length ==0 ||!reg.test(Seq)) {
        if(user.Language ==1) {
          throw Error(`Seq must not be empty and it should be number`)
        } else if (user.Language ==2) {
          throw Error(`Seq no debe estar vacío y debe ser una número`)
        } else {
          throw Error(`Seq must not be empty and it should be number`)
        }
        
      }
      return Seq
    }),
  ];
};

// const validate_driver_steps = () => {
//   return [
//     body("route_started")
//       .notEmpty()
//       .withMessage("route started must not be empty")
//       .isDate()
//       .withMessage("route started field must be in (yyyy-mm-dd) format"),
//     body("longitude")
//       .notEmpty()
//       .withMessage("longitude must not be empty")
//       .isDecimal()
//       .withMessage("longitude must be a number")
//       .isFloat({ min: -180, max: 180 })
//       .withMessage("longitude must be between -180 and 180"),
//     body("latitude")
//       .notEmpty()
//       .withMessage("latitude must not be empty")
//       .isDecimal()
//       .withMessage("latitude must be a number")
//       .isFloat({ min: -90, max: 90 })
//       .withMessage("latitude must be between -90 and 90"),
//     body("step_string")
//       .notEmpty()
//       .withMessage("step_string msut not empty")
//       .isString()
//       .withMessage("step_string should be a string"),
//     body("step_type")
//       .notEmpty()
//       .withMessage("step_type must not be empty")
//       .isNumeric()
//       .withMessage("step_type must be a number"),
//   ];
// };
const validate_driver_actions = () => {
  return [
    body("action")
    .custom(async (action , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(action,user,"string","cuerda","action")
      customVerifyLength(action,user,5,"action length should atleast 5 char long","action la longitud debe tener al menos 5 caracteres de largo")
      return action
    }),
      body("latitude")
      .custom(async (latitude , { req })=> {
        const user = await User.findOne({_id:req.user.userId})
        customVerify(latitude,user,"number","número","latitude")
       
        return latitude
      }),
      body("longitude")
      .custom(async (longitude , { req })=> {
        const user = await User.findOne({_id:req.user.userId})
        customVerify(longitude,user,"number","número","longitude")
       
        return longitude
      }),
  ];
};
const validate_barCode = () => {
  return [
    body("barcode").custom(async (barcode , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      if(barcode ==undefined) {
        if(user.Language ==1) {
          throw Error(`barcode is incorrect`)
        } else if (user.Language ==2) {
          throw Error(`el código de barras es incorrecto`)
        } else {
          throw Error(`barcode is incorrect`)
        }
        
      }

      let arr = barcode.split("/");
      if (arr.length != 3) {
        if(user.Language ==1) {
          throw Error(`barcode is incorrect`)
        } else if (user.Language ==2) {
          throw Error(`el código de barras es incorrecto`)
        } else {
          throw Error(`barcode is incorrect`)
        }
      }
      return arr;
    }),
  ];
};
module.exports = {
  deliveryValidationRules,
  updateDeliveryValidationRules,
  driverLoginValidationRules,
  orders,
  order,
  validateSeqNumber,
  validate_barCode,
  validate_driver_actions,
};
