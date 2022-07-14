const User = require("../model/user");
const Orders = require("../model/orders");
const Store = require("../model/store");
const moment = require("moment");

/**
 * @swagger
 * /orders?page:
 *   get:
 *     summary: return orders
 *     tags: [orders]
 *     parameters:
 *      - in: query
 *        name: page
 *        schema:
 *          type: number
 *        description: page number
 *     responses:
 *       200:
 *         description: return orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       422:
 *         description: validatio error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

//fetching all user's orders
//order_entry_method = 3
exports.getOrders = async (req, res) => {
  let order_per_page = 10;
  let order_length;
  let pageNo = req.query.page || 1;
  let success_status,
    failed_status,
    wrong_page_no_msg,
    No_order_available,
    ready,
    unconfirmed;
  let userId = req.user.userId;
  let query;
  let date_sent_to_device_check = moment(new Date()).format(
    process.env.YYYYMMDD
  );
  let datetime_created_check = moment(new Date())
    .add(1, "days")
    .format(process.env.YYYYMMDD);
  try {
    pageNo = parseInt(pageNo);
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    success_status =
      user.Language == 1
        ? process.env.SUCCESS_STATUS_ENGLISH
        : process.env.SUCCESS_STATUS_SPANISH;
    failed_status =
      user.Language == 1
        ? process.env.FAILED_STATUS_ENGLISH
        : process.env.FAILED_STATUS_SPANISH;
    wrong_page_no_msg =
      user.Language == 1
        ? process.env.WORONG_PAGE_NO_MSG_ENGLISH
        : process.env.WORONG_PAGE_NO_MSG_SPANISH;
    No_order_available =
      user.Language == 1
        ? process.env.NO_ORDER_AVAILABLE_ENGLISH
        : process.env.NO_ORDER_AVAILABLE_SPANISH;
    unconfirmed =
      user.Language == 1
        ? process.env.UNCONFIRMED_ENGLISH
        : process.env.UNCONFIRMED_SPANISH;
    ready =
      user.Language == 1
        ? process.env.READY_ENGLISH
        : process.env.READY_SPANISH;
    // }
    //if page number is incorrect
    if (pageNo < 1 || null) {
      return res.status(400).send({
        status: failed_status,
        statusCode: 400,
        error: wrong_page_no_msg,
      });
    }
    //fetching store doc of logged in user
    store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        store_id: "store_id",
      }
    );
    //checking if show_yesterdays_orders_too ==1 and if it is eq to one then also load yesterday orders
    if (store != null || undefined) {
      if (store.show_yesterdays_orders_too == 1) {
        //code for getting yesterday date
        date_sent_to_device_check = moment()
          .subtract(1, "days")
          .format(process.env.YYYYMMDD);
      }
    }

    if (user.load_in_late_orders_too != 1) {
      query = {
        store_id: user.store_id,
        hidden: { $ne: 1 },
        deleted_from_device: { $ne: 1 },
        visited: { $ne: 1 },
        driver_string: { $eq: user.driver_string },
        DeliveryDate: {
          $ne: moment().subtract(1, "days").format(process.env.YYYYMMDD),
        },
        $and: [
          { date_sent_to_device: { $gte: date_sent_to_device_check } },
          { datetime_created: { $lt: datetime_created_check } },
        ],
      };
    } else {
      query = {
        store_id: user.store_id,
        hidden: { $ne: 1 },
        deleted_from_device: { $ne: 1 },
        visited: { $ne: 1 },
        driver_string: { $eq: user.driver_string },
        DeliveryDate: {
          $ne: moment().subtract(1, "days").format(process.env.YYYYMMDD),
        },
        $and: [{ date_sent_to_device: { $gte: date_sent_to_device_check } }],
      };
    }

    const orders = await Orders.find(query)
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);
    //adding status field in orders by placing if condition
    orders.map((order) => {
      if (order.boxes_scanned_in == order.total_boxes) {
        order.status = "Ready";
      } else {
        order.status = "Unconfirmed";
      }
    });
    //getting order length
    order_length = orders.length;
    //if orders array length is empty and page no is 1 then throw responce
    if (order_length == 0 && pageNo == 1) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: No_order_available,
      });
    }
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      order_length,
      store,
      data: { user, orders },
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

/**
 * @swagger
 * /orders/byscan?page:
 *   get:
 *     summary: return orders
 *     tags: [orders]
 *     parameters:
 *      - in: query
 *        name: page
 *        schema:
 *          type: number
 *        description: page number
 *     responses:
 *       200:
 *         description: return orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */
//order_entry_method = 1
exports.get_orders_by_scan = async (req, res) => {
  let order_per_page = 10;
  let pageNo = req.query.page || 1;
  let success_status, failed_status, wrong_page_no_msg, No_order_available;
  let userId = req.user.userId;
  let order_length;
  let datetime_created_check = moment()
    .subtract(1, "days")
    .format(process.env.YYYYMMDD);

  try {
    pageNo = parseInt(pageNo);

    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_ENGLISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_SPANISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      wrong_page_no_msg = process.env.WORONG_PAGE_NO_MSG_ENGLISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH;
    }
    //if page number is incorrect
    if (pageNo < 1 || null || undefined) {
      return res.status(400).send({
        status: failed_status,
        statusCode: 400,
        error: wrong_page_no_msg,
      });
    }
    //fetching store doc of logged in user
    store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        store_id: "store_id",
      }
    );
    //query need to run on db from getting orders
    query = {
      store_id: user.store_id,
      visited: { $ne: 1 },
      route_started: { $eq: null },
      driver_string: { $eq: null },
      datetime_created: { $gte: datetime_created_check },
    };
    //change in datetime_created if load_in_late_orders_too is not eq to one
    if (user.load_in_late_orders_too != 1) {
      datetime_created_check = moment(new Date())
        .add(1, "days")
        .format(process.env.YYYYMMDD);
      query = {
        store_id: user.store_id,
        visited: { $ne: 1 },
        route_started: { $eq: null },
        driver_string: { $eq: null },
        datetime_created: { $lt: datetime_created_check },
      };
    }

    const orders = await Orders.find(query)
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);
    orders.map((order) => {
      if (order.boxes_scanned_in == order.total_boxes) {
        order.status = "Ready";
      } else {
        order.status = "not_confirmed";
      }
    });
    order_length = orders.length;
    //if orders array length is empty and page no is 1 then throw responce
    if (order_length == 0 && pageNo == 1) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: No_order_available,
      });
    }
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      order_length,
      store,
      data: orders,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
//fetching user order by order id
exports.getOrderByOrderId = async (req, res) => {
  let success_status, failed_status, error_msg;
  let userId = req.user.userId;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      error_msg = process.env.ERROR_MSG_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      error_msg = process.env.ERROR_MSG_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      error_msg = process.env.ERROR_MSG_ENGLISH;
    }

    const order = await Orders.findOne({ order_id: req.params.orderId });
    if (order == null || undefined) {
      return res
        .status(404)
        .send({ status: failed_status, statusCode: 404, error: error_msg });
    }
    res
      .status(200)
      .send({ status: success_status, statusCode: 200, data: order });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

/**
 * @swagger
 * /orders/{byseq}:
 *   get:
 *     summary: return orders using Seq number
 *     tags: [orders]
 *     parameters:
 *      - in: path
 *        name: byseq
 *        schema:
 *          type: number
 *        required: true
 *        description: Seq number
 *     responses:
 *       200:
 *         description: order fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: no orders available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

//fetching user order by Seq
exports.getOrderBySeq = async (req, res) => {
  let seq = req.params.byseq;
  let success_status, failed_status, invaild_seq, invalid_box_status;
  let userId = req.user.userId;
  let acceptedStatus = [
    "NOT_CONFIRMED",
    "MANUALLY_DELETED",
    "NOT_SCANNED_OUT",
    "NOT_DELIVERED",
    "RETURNED",
    "SCANNED_OUT",
    "SCANNED_IN",
    "MANUALLY_SCANNED_OUT",
  ];
  let statusMatch = 0;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      invaild_seq = process.env.INVAILD_SEQ_ENGLISH;
      invalid_box_status = process.env.INVALID_BOX_STATUS_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      invaild_seq = process.env.INVAILD_SEQ_SPANISH;
      invalid_box_status = process.env.INVALID_BOX_STATUS_SPANISH;
    }
    store = await findData(
      Store,
      { store_id: user.store_id },
      {
        strict_box_scan_in: "strict_box_scan_in",
      }
    );
    const order = await Orders.findOne({
      Seq: seq,
      $and: [
        {
          datetime_created: {
            $gte: moment().subtract(1, "days").format(process.env.YYYYMMDD),
          },
        },
        {
          datetime_created: {
            $lt: moment().add(1, "days").format(process.env.YYYYMMDD),
          },
        },
      ],
    });

    if (order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_seq,
      });
    }
    //after getting order with seq number checking if boxes of order conatins any status
    //of above array

    if (order.boxes.length > 0 && store.strict_box_scan_in == 1) {
      acceptedStatus.forEach((status) => {
        order.boxes.forEach((box) => {
          if (status == box.status.type) {
            statusMatch++;
          }
        });
      });
    }
    console.log(invalid_box_status);
    if (statusMatch > 0) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invalid_box_status,
      });
    }
    res
      .status(200)
      .send({ status: success_status, statusCode: 200, data: order });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

//fetching user order by current Date
exports.getOrderByCurrentDate = async (req, res) => {
  let success_status, failed_status, No_order_available;
  let userId = req.user.userId;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      No_order_available = process.env.NO_ORDER_AVAILABLE_ENGLISH;
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
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        msg: No_order_available,
      });
    }
    res
      .status(200)
      .send({ status: success_status, statusCode: 200, data: orders });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

exports.confirmBarCode = async (req, res) => {
  let success_status, failed_status, err_barcode;
  let userId = req.user.userId;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      err_barcode = process.env.ERR_BARCODE_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      err_barcode = process.env.ERR_BARCODE_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      err_barcode = process.env.ERR_BARCODE_ENGLISH;
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
        .send({ status: failed_status, statusCode: 400, error: err_barcode });
    }
    if (order.total_boxes >= barcodeData[2]) {
      res
        .status(200)
        .send({ status: success_status, statusCode: 200, data: order });
    } else {
      return res
        .status(400)
        .send({ status: failed_status, statusCode: 400, error: err_barcode });
    }
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

exports.listOrders = async (req, res) => {
  let success_status, failed_status, order_assigned_success, invaild_orderId;
  let userId = req.user.userId;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH;
      invaild_orderId = process.env.ERROR_MSG_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_SPANISH;
      invaild_orderId = process.env.ERROR_MSG_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      order_assigned_success = process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH;
      invaild_orderId = process.env.ERROR_MSG_ENGLISH;
    }
    const orderId = req.body.orderId;
    const driverId = req.user.userId;
    let boxIds = [];
    //fetching orders according to id

    let order = await Orders.findOne({ order_id: orderId });
    if (order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
    // getting all boxIds and store them in array
    if (order.boxes.length !== 0) {
      for (i = 0; i < order.boxes.length; i++) {
        boxIds.push(order.boxes[i]._id);
      }
      //looping to update each box with driver id
      let updated_order = await Orders.findOne({ order_id: orderId });
      for (i = 0; i < boxIds.length; i++) {
        updated_order.boxes[i].status.type = type;
        updated_order.boxes[i].status.description = description;
        updated_order.boxes[i].status.driver_id = driverId;
      }
      updated_order.save();
      res.status(200).send({
        status: success_status,
        statusCode: 200,
        message: order_assigned_success,
        data: updated_order.boxes,
      });
    } else {
      res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

async function findData(Modal, queryObj = {}, reqFieldObj = {}) {
  let reqFields,
    data,
    str = "";
  //console.log(model);
  if (Object.keys(reqFieldObj).length === 0) {
    data = await Modal.find(queryObj);
  } else {
    reqFields = Object.values(reqFieldObj);
    for (i = 0; i < reqFields.length; i++) {
      str = str + reqFields[i] + " ";
    }
    data = await Modal.findOne(queryObj).select(str);
  }
  return data;
}
