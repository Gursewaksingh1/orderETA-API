const { body, check } = require("express-validator");
const User = require("../model/_User");

//func for verifying is input empty and datatype
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
//func for verifying length of input field
function customVerifyLength(val,userObj,minLen,errorMsg,errorMsg_spanish) {
  if(val.length < minLen) {
    if(userObj.Language ==1) {
      throw Error(`${errorMsg}`)
    } else if (userObj.Language ==2) {
      throw Error(`${errorMsg_spanish}`)
    } else {
      throw Error(`${errorMsg}`)
    }
    
  }
}
const update_user_stops = () => {
  return [
    body("previous_stop")
    .custom(async (previous_stop , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(previous_stop,user,"string","cadena","previous_stop")
      customVerifyLength(previous_stop,user,5,"previous_stop string length slould atleast 5 char long","La longitud de la cadena de parada anterior debe tener al menos 5 caracteres.")
      return previous_stop
    }),
    body("latest_action")
    .custom(async (latest_action , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(latest_action,user,"string","cadena","latest_action")
      customVerifyLength(latest_action,user,5,"latest_action string length slould atleast 5 char long","La longitud de la cadena last_action debe tener al menos 5 caracteres.")
      return latest_action
    }),
    body("next_stop")
    .custom(async (next_stop , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(next_stop,user,"string","cadena","next_stop")
      customVerifyLength(next_stop,user,5,"next_stop string length slould atleast 5 char long","La longitud de la cadena next_stop debe tener al menos 5 caracteres.")
      return next_stop
    }),
  ]
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
      .withMessage("username must contain atleast three characters")
     ,
    body("password")
      .notEmpty()
      .withMessage("password must be not empty")
      .isLength({ min: 6, max: 30 })
      .withMessage("password must contain atleast six characters")
     ,
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
      var reg = /^\d+$/;  //checking if string only contains number or not
      const user = await User.findOne({_id:req.user.userId})
      if(page ==undefined || page.length ==0 ||!reg.test(page)) {
        if(user.Language ==1) {
          throw Error(`page must not be empty and it should be number`)
        } else if (user.Language ==2) {
          throw Error(`page no debe estar vacío y debe ser una número`)
        } else {
          throw Error(`page must not be empty and it should be number`)
        }
        
      }
      if(page<1) {
        if(user.Language ==1) {
          throw Error(`page number must be natural number`)
        } else if (user.Language ==2) {
          throw Error(`page número debe ser número natural`)
        } else {
          throw Error(`page number must be natural number`)
        }
      }
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

let validate_user_image = () => {
  return [
    body("image").custom(async (image , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      if(req.file ==undefined) {
        if(user.Language ==1) {
          throw Error(`image field must not be empty or Only .png, .jpg and .jpeg format allowed!`)
        } else if (user.Language ==2) {
          throw Error(`El campo de la imagen no debe estar vacío o ¡Solo se permiten los formatos .png, .jpg y .jpeg!`)
        } else {
          throw Error(`image field must not be empty or Only .png, .jpg and .jpeg format allowed!`)
        }
        
      }
      if(req.file.size> 2*1024*1024) {
        if(user.Language ==1) {
          throw Error(`image size must be less then or equal to 2 MB`)
        } else if (user.Language ==2) {
          throw Error(`el tamaño de la imagen debe ser inferior o igual a 2 MB`)
        } else {
          throw Error(`image size must be less then or equal to 2 MB`)
        }
      }
    })
  ]
}
module.exports = {
  deliveryValidationRules,
  updateDeliveryValidationRules,
  driverLoginValidationRules,
  orders,
  order,
  validateSeqNumber,
  validate_barCode,
  validate_driver_actions,
  validate_user_image,
  update_user_stops
};
