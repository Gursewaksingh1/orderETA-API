const User = require("../model/_User");
const Orders = require("../model/ordersModel");

//fetching all user's orders
exports.getOrders = async (req, res) => {
  let order_per_page = 10;
  let pageNo = req.query.page;

  let success_status,failed_status,wrong_page_no_msg,No_order_available
  let userId = req.user.userId
  try {
  
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_ENGLISH
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_SPANISH
      No_order_available = process.env.NO_ORDER_AVAILABLE_SPANISH 

    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_ENGLISH
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH
    }
    //if page number is incorrect
    if (pageNo < 1 || null || undefined) {
      return res.status(400).send({
        status: failed_status,
        statusCode:400,
        error: wrong_page_no_msg,
      });
    }
  //getting user orders by userId and current date-time
    const orders = await Orders.find({
      user_id: req.user.userId,
      $and: [
        { eta: { $gte: new Date().setHours(0, 0, 0, 0) } },
        { eta: { $lt: new Date().setHours(23, 59, 59, 0) } },
      ],
    })
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);
      //if orders array length is empty and page no is 1 then throw responce
      if (orders.length == 0 &&pageNo==1) {
        return res
          .status(404)
          .send({ status: failed_status,statusCode:404, msg: No_order_available});
      }
    res.status(200).send({ status:success_status,statusCode:200, data: orders });
  } catch (err) {
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};

//fetching user order by order id
exports.getOrderByOrderId = async (req, res) => {
  let success_status,failed_status,error_msg
  let userId = req.user.userId
  try {
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      error_msg = process.env.ERROR_MSG_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      error_msg = process.env.ERROR_MSG_SPANISH 
    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      error_msg = process.env.ERROR_MSG_ENGLISH
    }

    const order = await Orders.findOne({ order_id: req.params.orderId });
    if (order == null || undefined) {
      return res
        .status(404)
        .send({ status: failed_status,statusCode:404, error: error_msg });
    }
    res.status(200).send({ status: success_status,statusCode:200, data: order });
  } catch (err) {
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};
//fetching user order by Seq
exports.getOrderBySeq = async (req, res) => {
  let seq = req.params.Seq;
  let success_status,failed_status,invaild_seq
  let userId = req.user.userId
  try {
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      invaild_seq = process.env.INVAILD_SEQ_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      invaild_seq = process.env.INVAILD_SEQ_SPANISH 
    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      invaild_seq = process.env.INVAILD_SEQ_ENGLISH
    }
    const orders = await Orders.find({
      $and: [{ user_id: req.user.userId }, { Seq: seq.toString() }],
    });
    if (orders.length == 0) {
      return res
        .status(404)
        .send({
          status:failed_status,
          statusCode:404,
          error: invaild_seq,
        });
    }
    res.status(200).send({ status: success_status,statusCode:200, data: orders });
  } catch (err) {
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};

//fetching user order by current Date
exports.getOrderByCurrentDate = async (req, res) => {
  let success_status,failed_status,No_order_available
  let userId = req.user.userId
  try {
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      No_order_available = process.env.NO_ORDER_AVAILABLE_SPANISH 
    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH
    }
    //fetching reords which is eta only today
    const orders = await Orders.find({
      user_id: req.user.userId,
      $and: [
        { eta: { $gte: new Date().setHours(0, 0, 0, 0) } },
        { eta: { $lt: new Date().setHours(23, 59, 59, 0) } },
      ],
    });
    if (orders.length == 0) {
      return res
        .status(404)
        .send({ status: failed_status,statusCode:404, msg: No_order_available});
    }
    res.status(200).send({ status: success_status,statusCode:200, data: orders });
  } catch (err) {
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};

exports.confirmBarCode = async (req, res) => {
  let success_status,failed_status,err_barcode
  let userId = req.user.userId
  try {
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      err_barcode = process.env.ERR_BARCODE_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      err_barcode = process.env.ERR_BARCODE_SPANISH 
    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      err_barcode = process.env.ERR_BARCODE_ENGLISH
    }
    let barcode = req.body.barcode;
    barcodeData = barcode.split("/");

    const order = await Orders.findOne({

      store_id: barcodeData[0],
      order_id: barcodeData[1],
    });

    if (order == null) {
      return res
        .status(400)
        .send({ status: failed_status,statusCode:400, error: err_barcode});
    }
    if (order.total_boxes >= barcodeData[2]) {
      res.status(200).send({ status: success_status,statusCode:200, data: order });
    } else {
      return res
        .status(400)
        .send({ status:failed_status,statusCode:400, error: err_barcode });
    }
  } catch (err) {
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};

exports.listOrders = async (req, res) => {
  let success_status,failed_status,order_assigned_success,invaild_orderId
  let userId = req.user.userId
  try {
    //fetching user using user id
    const user = await User.findOne({_id:userId})
    // checking for user language
    if(user.Language ==1) {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH
      invaild_orderId = process.env.ERROR_MSG_ENGLISH
    } else if(user.Language ==2){
      success_status =  process.env.SUCCESS_STATUS_SPANISH 
      failed_status = process.env.FAILED_STATUS_SPANISH 
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_SPANISH 
      invaild_orderId = process.env.ERROR_MSG_SPANISH 
    } else {
      success_status =  process.env.SUCCESS_STATUS_ENGLISH
      failed_status = process.env.FAILED_STATUS_ENGLISH
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH
      invaild_orderId = process.env.ERROR_MSG_ENGLISH
    }
    const orderId = req.body.orderId;
    const driverId = req.user.userId;
    let boxIds = [];
    //fetching orders according to id

    let order = await Orders.findOne({ order_id: orderId });
  if(order ==null) {
    return res.status(404).send({status:failed_status,statusCode:404,error:invaild_orderId})
  }
    // getting all boxIds and store them in array
    if (order.boxes.length !== 0) {
      for (i = 0; i < order.boxes.length; i++) {
        boxIds.push(order.boxes[i]._id);
      }
      //looping to update each box with driver id
     let updated_order =await Orders.findOne({ order_id: orderId })
          for (i = 0; i < boxIds.length; i++) {
            updated_order.boxes[i].status.driver_id = driverId;
          }
          updated_order.save();
      res.status(200).send({
        status: success_status,
        statusCode:200,
        message: order_assigned_success,
        data: updated_order.boxes
      });
    
    } else {
      res
        .status(404)
        .send({ status: failed_status,statusCode:404, error: invaild_orderId});
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failed_status,statusCode:400, error: err });
  }
};
