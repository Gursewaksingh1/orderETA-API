const { body, check } = require("express-validator");
const User = require("../model/user");
const Language = require("../model/language");
//func for verifying is input empty and datatype
function customVerify(val,userObj,datatype,datatype_spanish,fieldName) {
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
function customVerifyLength(val,userObj,minLen,errorMsg) {
 
  if(val.length < minLen) {
      throw Error(`${errorMsg}`)
  }
}
// const update_user_stops = () => {
//   return [
//     //console.log("data");
//     body("previous_stop").trim()
//     .custom(async (previous_stop , { req })=> {
//       const user = await User.findOne({_id:req.user.userId})
//       customVerify(previous_stop,user,"string","cadena","previous_stop")
//       customVerifyLength(previous_stop,user,5,"previous_stop string length slould atleast 5 char long","La longitud de la cadena de parada anterior debe tener al menos 5 caracteres.")
//       return previous_stop
//     }),
//     body("latest_action").trim()
//     .custom(async (latest_action , { req })=> {
//       const user = await User.findOne({_id:req.user.userId})
//       customVerify(latest_action,user,"string","cadena","latest_action")
//       customVerifyLength(latest_action,user,5,"latest_action string length slould atleast 5 char long","La longitud de la cadena last_action debe tener al menos 5 caracteres.")
//       return latest_action
//     }),
//     body("next_stop").trim()
//     .custom(async (next_stop , { req })=> {
//       const user = await User.findOne({_id:req.user.userId})
//       customVerify(next_stop,user,"string","cadena","next_stop")
//       customVerifyLength(next_stop,user,5,"next_stop string length slould atleast 5 char long","La longitud de la cadena next_stop debe tener al menos 5 caracteres.")
//       return next_stop
//     }),
//   ]
// }
const deliveryValidationRules = () => {
  return [
    body("orderIds")
    .custom(async (orderIds , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      const language = await Language.findOne({ language_id: user.Language });
      const langObj = JSON.parse(language.language_translation);
      if(typeof orderIds != "object" ||orderIds.length == 0) {
        langObj.validation_text = langObj.validation_text.replace("$fieldName","orderIds")
        langObj.validation_text = langObj.validation_text.replace("$datatype","array")
          throw Error(langObj.validation_text)
        }
      return orderIds
    })
    
  ];
};
//not used
const updateDeliveryValidationRules = () => {
  return [
    body("endLatitude").trim()
    .custom(async (endLatitude , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(endLatitude,user,"number","número","endLatitude")
      return endLatitude
    }),
    body("endLongitude").trim()
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
      .trim()
      .withMessage("username must be not empty")
      .isString()
      .withMessage("username must be a string")
      .isLength({ min: 3, max: 30 })
      .withMessage("username must contain atleast three characters")
     ,
    body("password")
      .notEmpty()
      .trim()
      .withMessage("password must be not empty")
      .isLength({ min: 6, max: 30 })
      .withMessage("password must contain atleast six characters")
     ,
  ];
};
//not used
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
//not used
const orders = () => {
  return [
    
     check("page")
     //.trim()
     .custom(async (page , { req })=> {
  page = parseInt(page)
      var reg = /^\d+$/;  //checking if string only contains number or not
      const user = await User.findOne({_id:req.user.userId})
      if(page ==undefined ||null) {
        return page
      }
      console.log(typeof page);
      page =page.trim()
      if(!reg.test(page)) {
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
  return [check("orderId").trim().custom(async (orderId , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    langObj.validation_text = langObj.validation_text.replace("$fieldName","orderId")
    langObj.validation_text = langObj.validation_text.replace("$datatype","string")
    customVerifyLength(orderId,user,1, langObj.validation_text)
    
    return orderId
  }),
  check("storeId").trim().custom(async (storeId , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    langObj.validation_text = langObj.validation_text.replace("$fieldName","storeId")
    langObj.validation_text = langObj.validation_text.replace("$datatype","string")
    customVerifyLength(storeId,user,1,langObj.validation_text)
    
    return storeId
  })
];
};

const validate_reason_for_manully_confirm_order = () => {
  return [check("orderId").trim() .custom(async (orderId , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    langObj.validation_text = langObj.validation_text.replace("$fieldName","orderId")
    langObj.validation_text = langObj.validation_text.replace("$datatype","string")
    customVerifyLength(orderId,user,1,langObj.validation_text)
    
    return orderId
  }),
  check("reason").custom(async (reason , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    langObj.validation_text = langObj.validation_text.replace("$fieldName","reason")
    langObj.validation_text = langObj.validation_text.replace("$datatype","string")
    if(reason ==undefined) {
      return "reason"
    }
    if(reason.length ==0 || typeof reason !="string") {
        throw Error(langObj.validation_text)
    }
    customVerifyLength(reason,user,5,langObj.validation_text)
    return reason
  }),
  check("storeId").trim().custom(async (storeId , { req })=> {
    const user = await User.findOne({_id:req.user.userId})
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    langObj.validation_text = langObj.validation_text.replace("$fieldName","storeId")
    langObj.validation_text = langObj.validation_text.replace("$datatype","string")
    customVerifyLength(storeId,user,1, langObj.validation_text)
    
    return storeId
  })
];
};

const validateSeqNumber = () => {
  return [
    check("byseq")
    
    .custom(async (byseq , { req })=> {
      //var reg = /^\d+$/;  //checking if string only contains number or not 
      const user = await User.findOne({_id:req.user.userId});
      const language = await Language.findOne({ language_id: user.Language });
      const langObj = JSON.parse(language.language_translation);
      langObj.validation_text = langObj.validation_text.replace("$fieldName","Seq")
      langObj.validation_text = langObj.validation_text.replace("$datatype","string")
      if(byseq ==undefined || byseq.length ==0) {
          throw Error(langObj.validation_text)
      }
      return byseq
    }),
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
      .withMessage("latitude must be between -90 and 90"),
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
const validate_driver_actions = () => {
  return [
    body("stepString").trim().isString().withMessage("stepString should not be empty and its type is number"),
      body("latitude").trim().isNumeric().withMessage("latitude should not be empty and its type is number"),
      body("longitude").trim().isNumeric().withMessage("longitude should not be empty and its type is number"),
  ];
};
const validate_barCode = () => {
  return [
    body("barcode").trim().custom(async (barcode , { req })=> {
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

const validatedebug_temp = () => {
  return [
    body("temp_desc_string")  .custom(async (temp_desc_string , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(temp_desc_string,user,"string","cuerda","temp_desc_string")
      customVerifyLength(temp_desc_string,user,5,"temp_desc_string length should atleast 5 char long","temp_desc_string la longitud debe tener al menos 5 caracteres de largo")
    return temp_desc_string
    })
  ]
}
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
const smsManagerValidation = () => {
  return [
    body("originalRouteStarted").not().isEmpty().withMessage("originalRouteStarted is must"),
    body("mapRoute").not().isEmpty().withMessage("mapRoute should not be empty"),
    body("unVisitedOrders").not().isEmpty().withMessage("unVisitedOrdersExist should not be empty")
  ]
}
const notifyManagerUserReturnValidation = () => {
  return [
    body("originalRouteStarted").not().isEmpty().withMessage("originalRouteStarted is must"),
    body("etaForStore").not().isEmpty().withMessage("etaForStore should not be empty"),
    body("justDeliveredAddress").not().isEmpty().withMessage("justDeliveredAddress should not be empty")
  ]
}
let validate_logged_routing_request = () => {
  return [
    body("the_url").custom(async (the_url , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(the_url,user,"string","cuerda","the_url")
      return the_url
    }),
    body("route_started").custom(async (route_started , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(route_started,user,"string","cuerda","route_started")
      return route_started
    }),
    body("the_result").custom(async (the_result , { req })=> {
      const user = await User.findOne({_id:req.user.userId})
      customVerify(the_result,user,"string","cuerda","the_result")
      return the_result
    }),
  ]
}

let validateLanguage = () => {
  return [
    body("language").trim()
    .custom(async (language , { req })=> {
      var reg = /^\d+$/;  //checking if string only contains number or not 
      const user = await User.findOne({_id:req.user.userId})
      if(language ==undefined || language.length ==0 ||!reg.test(language)) {
        if(user.Language ==1) {
          throw Error(`language must not be empty and it should be number`)
        } else if (user.Language ==2) {
          throw Error(`language no debe estar vacío y debe ser una número`)
        }
      }
      return language
    }),
  ];
}

let returnOrder = () => {
  return [
    body("option").notEmpty().isNumeric().withMessage("option key should be number and not empty"),
    body("orderId").notEmpty().withMessage("orderId should not be empty"),
    body("latitude").notEmpty().withMessage("latitude should not be empty"),
    body("longitude").notEmpty().withMessage("longitude should not be empty"),
  ]
}

let customerPage = () => {
  return [
    body("latitude").notEmpty().withMessage("latitude should not be empty"),
    body("longitude").notEmpty().withMessage("longitude should not be empty"),
    body("orderId").notEmpty().isString().withMessage("orderId should not be empty"),
    body("boxNumber").notEmpty().isNumeric().withMessage("boxNumber should not be empty"),
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
  validatedebug_temp,
  validate_logged_routing_request,
  validateLanguage,
  validate_reason_for_manully_confirm_order,
  smsManagerValidation,
  notifyManagerUserReturnValidation,
  returnOrder,
  customerPage
};
