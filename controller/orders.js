const User = require("../model/user");
const Orders = require("../model/orders");
const Store = require("../model/store");
const Reason = require("../model/reason");
const moment = require("moment");
const BarcodeFormat = require("../model/barcodeformat");

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
    //adding status field in orders
    await Orders.updateMany(query, { $set: { status: 0 } });

    let orders = await Orders.find(query)
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);

    let newOrders = orders.map((order) => {
      // const copy= {...order}
      if (order.boxes_scanned_in == order.total_boxes) {
        order.statusKey = "Ready";
      } else {
        order.statusKey = "Unconfirmed";
      }
      return order;
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
      data: { user, orders: newOrders },
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

    query = {
      store_id: user.store_id,
      visited: { $ne: 1 },
      route_started: { $eq: null },
      driver_string: { $eq: null },
      datetime_created: {
        $gte: moment().subtract(1, "days").format(process.env.YYYYMMDD),
      },
    };
    //change in datetime_created if load_in_late_orders_too is not eq to one
    if (user.load_in_late_orders_too != 1) {
      query = {
        store_id: user.store_id,
        visited: { $ne: 1 },
        route_started: { $eq: null },
        driver_string: { $eq: null },

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
      };
    }
    await Orders.updateMany(query, { $set: { status: 0 } });

    const orders = await Orders.find(query)
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);
    //adding status key in orders

    orders.map((order) => {
      if (order.boxes_scanned_in == order.total_boxes) {
        order.statusKey = "Ready";
      } else {
        order.statusKey = "Unconfirmed";
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
    if (statusMatch > 0) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invalid_box_status,
      });
    }

    order.map((order) => {
      order.status = 0;
    });
    order.save();
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

/**
 *   @swagger
 *   components:
 *   schemas:
 *     delete_order:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: order id
 *       example:
 *           orderId: 975
 *
 */
/**
 * @swagger
 * /orders/deleteorder:
 *   put:
 *     summary: delete order from user device
 *     tags: [orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/delete_order'
 *     responses:
 *       200:
 *         description: order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/delete_order'
 *       403:
 *         description: invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/delete_order'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/delete_order'
 *     security:
 *       - bearerAuth: []
 */

exports.deleteOrder = async (req, res) => {
  let success_status,
    failed_status,
    order_deleted_success,
    order_deleted_failed;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    success_status =
      user.Language == 1
        ? process.env.SUCCESS_STATUS_ENGLISH
        : process.env.SUCCESS_STATUS_SPANISH;
    failed_status =
      user.Language == 1
        ? process.env.FAILED_STATUS_ENGLISH
        : process.env.FAILED_STATUS_SPANISH;
    order_deleted_success =
      user.Language == 1
        ? process.env.DELETE_ORDER_ENGLISH
        : process.env.DELETE_ORDER_SPANISH;
    order_deleted_failed =
      user.Language == 1
        ? process.env.DELETE_ORDER_FAILED_ENGLISH
        : process.env.DELETE_ORDER_FAILED_SPANISH;
    //delete order query
    const order = await Orders.findOneAndUpdate(
      { order_id: req.body.orderId },
      {
        $set: {
          deleted_from_device: 1,
          date_sent_to_device: moment().format("yyyy-MM-dd-HH:mm:ss"),
        },
      },
      { new: true }
    );
    if (order == null) {
      res.status(400).send({
        status: failed_status,
        statusCode: 400,
        error: order_deleted_failed,
      });
    } else if (order.deleted_from_device == 1) {
      res.status(200).send({
        status: success_status,
        statusCode: 200,
        data: order_deleted_success,
      });
    }
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

/**
 *   @swagger
 *   components:
 *   schemas:
 *     scan_order:
 *       type: object
 *       required:
 *         - rawData
 *       properties:
 *         rawData:
 *           type: string
 *           description: raw barcode of box
 *       example:
 *           rawData: "9998701093402"
 *
 */
/**
 * @swagger
 * /orders/scanbarcode:
 *   put:
 *     summary: verify barcode and confirm order's box
 *     tags: [orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/scan_order'
 *     responses:
 *       200:
 *         description: barcode verify successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/scan_order'
 *       403:
 *         description: invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/scan_order'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/scan_order'
 *     security:
 *       - bearerAuth: []
 */

exports.scanOrderBox = async (req, res) => {
  let success_status,
    box_scan_msg_success,
    failed_status,
    box_scan_success,
    invalid_barcode_len,
    invalid_barcode,
    admin_msg,
    uncomplete_barcode,
    already_scanned_msg,
    invalid_storeid,
    invalid_boxno,
    warning,
    another_driver_order_msg,
    duplicate_scan,
    order_is_young_msg,
    order_is_old_msg,
    wrong_boxno,
    wrong_barcode,
    found_old_order_msg,
    another_driver_order,
    found,
    not_found,
    statusMatch = false;
  let userId = req.user.userId,
    flag = false;
  let store, storeId, orderId, boxNumber;
  let components = [],
    splitWith = [];
  let buchbarcode;
  let rawData = req.body.rawData;
  //if front-end does not send any value then 1
  let check = req.body.check ?? 1;
  let regex_arr = [];
  // console.log(specialChars.test(str))
  let acceptedStatus = [
    "IN_STORE",
    "NOT_CONFIRMED",
    "MANUALLY_DELETED",
    "NOT_SCANNED_OUT",
    "NOT_DELIVERED",
    "RETURNED",
    "SCANNED_OUT",
    "MANUALLY_SCANNED_OUT",
    "MANUALLY_DELIVERED",
    "SCANNED_IN",
  ];

  try {
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
    order_assigned_success =
      user.Language == 1
        ? process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH
        : process.env.ORDER_ASSIGNED_SUCCESS_SPANISH;
    invaild_orderId =
      user.Language == 1
        ? process.env.ERROR_MSG_ENGLISH
        : process.env.ERROR_MSG_SPANISH;
    invalid_barcode_len =
      user.Language == 1
        ? process.env.INVALID_BARCODE_LEN_ENGLISH
        : process.env.INVALID_BARCODE_LEN_SPANISH;
    invalid_barcode =
      user.Language == 1
        ? process.env.INVALID_BARCODE_ENGLISH
        : process.env.INVALID_BARCODE_SPANISH;
    uncomplete_barcode =
      user.Language == 1
        ? process.env.UNCOMPLETE_BARCODE_ENGLISH
        : process.env.UNCOMPLETE_BARCODE_SPANISH;
    invalid_storeid =
      user.Language == 1
        ? process.env.INVAILD_STOREID_ENGLISH
        : process.env.INVAILD_STOREID_SPANISH;
    invalid_boxno =
      user.Language == 1
        ? process.env.INVALID_BOXNO_ENGLISH
        : process.env.INVALID_BOXNO_SPANISH;
    duplicate_scan =
      user.Language == 1
        ? process.env.DUPLICATE_SCAN_ENGLISH
        : process.env.DUPLICATE_SCAN_SPANISH;
    another_driver_order =
      user.Language == 1
        ? process.env.ANOTHER_DRIVER_ORDER_ENGLISH
        : process.env.ANOTHER_DRIVER_ORDER_SPANISH;
    another_driver_order_msg =
      user.Language == 1
        ? process.env.ANOTHER_DRIVER_ORDER_MSG_ENGLISH
        : process.env.ANOTHER_DRIVER_ORDER_MSG_SPANISH;

    wrong_boxno =
      user.Language == 1
        ? process.env.WRONG_BOXNO_ENGLISH
        : process.env.WRONG_BOXNO_SPANISH;
    found_old_order_msg =
      user.Language == 1
        ? process.env.FOUND_OLDEST_ORDER_ENGLISH
        : process.env.FOUND_OLDEST_ORDER_SPANISH;
    order_is_old_msg =
      user.Language == 1
        ? process.env.FORDER_IS_OLD_ENGLISH
        : process.env.ORDER_IS_OLD_SPANISH;
    order_is_young_msg =
      user.Language == 1
        ? process.env.ORDER_IS_YOUNG_ENGLISH
        : process.env.ORDER_IS_YOUNG_SPANISH;
    box_scan_success =
      user.Language == 1
        ? process.env.BOX_SCAN_SUCCESS_ENGLISH
        : process.env.BOX_SCAN_SUCCESS_SPANISH;
    box_scan_msg_success =
      user.Language == 1
        ? process.env.BOX_SCAN_SUCCESS_MSG_ENGLISH
        : process.env.BOX_SCAN_SUCCESS_MSG_SPANISH;

    already_scanned =
      user.Language == 1
        ? process.env.ALREADY_SCANNED_ENGLISH
        : process.env.ALREADY_SCANNED_SPANISH;
    already_scanned_msg =
      user.Language == 1
        ? process.env.ALREADY_SCANNED_MSG_ENGLISH
        : process.env.ALREADY_SCANNED_MSG_SPANISH;

    wrong_barcode =
      user.Language == 1
        ? process.env.ERR_BARCODE_ENGLISH
        : process.env.ERR_BARCODE_SPANISH;
    warning =
      user.Language == 1
        ? process.env.WARNING_ENGLISH
        : process.env.WARNING_SPANISH;
    admin_msg =
      user.Language == 1
        ? process.env.ADMIN_MSG_ENGLISH
        : process.env.ADMIN_MSG_SPANISH;

    found =
      user.Language == 1
        ? process.env.FOUND_ENGLISH
        : process.env.FOUND_SPANISH;
    not_found =
      user.Language == 1
        ? process.env.NOT_FOUND_ENGLISH
        : process.env.NOT_FOUND_SPANISH;
    store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        barcode_type: "barcode_type",
        store_id: "store_id",
        barcode_minimum: "barcode_minimum",
        strict_box_scan_in: "strict_box_scan_in",
        old_order_time: "old_order_time",
        check_for_old_orders_first: "check_for_old_orders_first",
        check_if_order_is_too_old: "check_if_order_is_too_old",
        young_order_time: "young_order_time",
        check_if_order_is_too_young: "check_if_order_is_too_young",
      }
    );
    //if these fields not present in store db
    store.young_order_time = store.young_order_time ?? 0;
    store.check_if_order_is_too_young = store.check_if_order_is_too_young ?? 0;
    store.check_if_order_is_too_old = store.check_if_order_is_too_old ?? 0;
    store.check_for_old_orders_first = store.check_for_old_orders_first ?? 0;
    store.old_order_time = store.old_order_time ?? 0;
    //converting rawData into string in case front end send it as number
    rawData = rawData.toString();

    //getting barcode format from db
    var barcodeFormats = await BarcodeFormat.find();
    barcodeFormats = JSON.parse(JSON.stringify(barcodeFormats));
    // console.log({barcodeFormats});

    var barcodeFormatBUCH = {};
    //to change position of BUCH format first store BUCH obj in var barcodeFormatBUCH
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUCH") {
        barcodeFormatBUCH = barcodeFormat;
      }
    });
    //then remove BUCH record from arr
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUCH") {
        barcodeFormats.splice(i, i);
      }
    });

    //now push it to the array
    barcodeFormats.push(barcodeFormatBUCH);
    //adding values in splitWith & regex_arr & getting from barcode_format collection
    splitWith = barcodeFormats.map((value) => value.split_with);
    regex_arr = barcodeFormats.map((value) => value.regexformat);

    //looping over regex_arr arr and comparing rawData with regex
    for (index = 0; index < regex_arr.length; index++) {
      if (rawData.match(regex_arr[index]) !== null) {
        //coomparing regex with barcode
        if (!isNaN(splitWith[index])) {
          buchbarcode = rawData.slice(0, -splitWith[index]);
          components.push(buchbarcode);
          components.push(rawData.substring(rawData.length - splitWith[index]));
          //checking if barcode which matched with regex has stodeId in format or not if not then add
          if (!barcodeFormats[index].storeid_available) {
            components.unshift(store.store_id);
          }
        } else {
          components = rawData.split(splitWith[index]);
          //checking if barcode which matched with regex has stodeId in format or not if not then add
          if (!barcodeFormats[index].storeid_available) {
            components.unshift(store.store_id);
          }
        }
        break;
      }
    }

    // switch (store.barcode_type) {
    //   case "RDT":
    //     components = [];
    //     components = rawData.split("/");
    //     break;
    //   case "CMP":
    //     components = [];
    //     let barcodetesting
    //     let numberTest =rawData[0];
    //     if (!isNaN(numberTest)) {
    //       barcodetesting = rawData
    //     } else {
    //       barcodetesting = rawData.substring(1);
    //     }

    //     components = barcodetesting.split("-") ?? [];
    //     components.unshift(store.store_id);
    //     break;
    //   case "BUC":
    //     components = [];
    //     buchbarcode = rawData.slice(0, -2);
    //     if (buchbarcode[0] == 0) {
    //       buchbarcode = buchbarcode.substring(1);
    //     }
    //     components.push(store.store_id);
    //     components.push(buchbarcode);
    //     if (rawData.length > 2) {
    //       components.push(
    //         rawData.substring(rawData.length - 2)
    //       );
    //     }
    //     break;
    //   case "STCR":
    //     components = [];
    //     buchbarcode = rawData.slice(0, -2);
    //     components.push(store.store_id);
    //     components.push(buchbarcode);
    //     if (rawData.length > 2) {
    //       components.push(
    //         rawData.substring(rawData.length - 2)
    //       );
    //     }
    //     break;
    //   case "MICRO":
    //     components = [];
    //     components.push(store.store_id);
    //     buchbarcode = rawData;
    //     if (buchbarcode.includes("RX")) {
    //       buchbarcode = rawData.slice(0, -2);
    //     }
    //     components.push(buchbarcode);
    //     components.push("01");
    //     break;
    //   case "RX30":
    //     components = [];
    //     components.push(store.store_id);
    //     if (rawData.length > 8) {
    //       let rawData2 = rawData.substring(4);
    //       rawData2 = rawData2.slice(0, -1);
    //       components.push(rawData2);
    //     } else {
    //       components.push(rawData.slice(0, -2));
    //     }
    //     components.push("01");
    //     break;
    //   case "IKON":
    //     components = [];
    //     components = rawData.split("-");
    //     components.unshift(store.store_id);
    //     components.push("-01");
    //     break;
    //   default:
    //     components = [];
    //     components.unshift(store.store_id);
    //     components.push(rawData);
    //     components.push("-01");
    //     break;
    // }

    if (rawData.length < store.barcode_minimum) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        type: "grid",
        title: wrong_barcode,
        error: invalid_barcode_len,
      });
    } else if (store.barcode_type == "RDT" && rawData.includes("/") == false) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        type: "grid",
        title: wrong_barcode,

        error: invalid_barcode,
      });
    } else {
      if (components.length != 3) {
        return res.status(406).send({
          status: failed_status,
          statusCode: 406,
          type: "grid",
          title: wrong_barcode,
          error: uncomplete_barcode,
        });
      } else if (user.store_id != components[0]) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 402,
          type: "grid",
          title: warning,
          error: invalid_storeid,
        });
      } else if (components[2] == null) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          type: "grid",
          title: warning,
          error: invalid_boxno,
        });
      }
    }
    storeId = components[0];
    orderId = components[1];
    boxNumber = parseInt(components[2]);
    //fetching order
    const order = await Orders.findOne({
      store_id: storeId,
      order_id: orderId,
    });

    //if order is null
    if (order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        type: "alert",
        title: not_found,
        error: wrong_barcode,
      });
    } else if (order.boxes.length == 0) {
      //if box arr exist but is empty
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        type: "alert",
        title: not_found,
        error: wrong_barcode,
      });
    } else if (order.boxes[boxNumber - 1] == undefined) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        type: "alert",
        title: not_found,
        error: wrong_barcode,
      });
    }
    // obj to send with each succes or failed response
    let responseObj = {
      message: "message",
      case_desc: order.boxes[boxNumber - 1].status.description, //storing box description
      boxNo: boxNumber,
      boxscanned: order.boxes_scanned_in ?? 0,
      totalBox: order.boxes.length,
      SeqNo: order.seq,
      Name: order.fname + " " + order.lname,
      streetAddress: order.street_address,
    };
    if (
      req.user.userId == order.boxes[boxNumber - 1].status.driver_id && //check if box which we are scanning is also scanned in &
      order.boxes[boxNumber - 1].status.type ==
        ("SCANNED_IN" || "MANUALLY_CONFIRMED") && //the driver id is also same as logged in user id
      order.status != 1
    ) {
      responseObj.message = duplicate_scan;

      return res.status(400).send({
        status: failed_status,
        statusCode: 400,
        type: "grid",
        title: duplicate_scan,
        error: responseObj,
      });
    }
    //if box number is zero throw error
    if (boxNumber == 0) {
      responseObj.message = wrong_boxno;
      return res.status(204).send({
        status: failed_status,
        statusCode: 204,
        type: "grid",
        title: wrong_boxno,
        error: responseObj,
      });
    }

    //strict_box_scan_in getting from store db
    if (store.strict_box_scan_in == 1) {
      acceptedStatus = [
        "IN_STORE",
        "NOT_CONFIRMED",
        "MANUALLY_DELETED",
        "NOT_SCANNED_OUT",
        "NOT_DELIVERED",
        "RETURNED",
        "SCANNED_IN",
      ];
    }

    //checking if user scanning this order box first time or not and flag true means user already have scanned some boxes
    // so we would not check this time if user is scanning another driver order and we would not check for oldest orders this time
    // only when user first time scan order that time we will check for those conditions
    for (i = 0; i < order.boxes.length; i++) {
      if (
        boxNumber != order.boxes[i].number &&
        order.boxes[i].status.type == "SCANNED_IN"
      ) {
        flag = true;
      }
    }
    //checking if accepted status matches or not
    acceptedStatus.forEach((status) => {
      if (status == order.boxes[boxNumber - 1].status.type) {
        statusMatch = true;
      }
    });
    //first check if box array exist if user first time scanning or and status is not eq to 1
    if (order.boxes.length !== 0 && statusMatch && order.status != 1) {
      //check if user trying to scan someone else's order then throw response
      //inside if check var will tell us if user gave permission for scanning else's order
      if (
        req.user.userId != order.user_id &&
        req.user.userId != undefined &&
        order.user_id.length != 0 &&
        !flag &&
        check == 1
      ) {
        let total_box_scan = await Orders.findOne({
          store_id: storeId,
          order_id: orderId,
        });
        responseObj.message =
          another_driver_order_msg + " " + order.fname + " " + order.lname;
        responseObj.boxscanned = total_box_scan.boxes_scanned_in;
        console.log(total_box_scan.boxes_scanned_in);
        return res.status(400).send({
          status: failed_status,
          statusCode: 401,
          type: "alert",
          title: another_driver_order,
          error: responseObj,
        });
      }

      order.boxes[boxNumber - 1].status.type = "SCANNED_IN";
      order.boxes[boxNumber - 1].status.description = "Box scanned in";
      order.boxes[boxNumber - 1].status.driver_id = req.user.userId;
      if (order.boxes_scanned_in) {
        order.boxes_scanned_in = order.boxes_scanned_in + 1;
      } else {
        order.boxes_scanned_in = 1;
      }
      //this will happen if user try to scan unassigned orders or with loading orders in app
      if (order.status == undefined) {
        order.status = 0;
      }
      order.save();

      //after saving order in db check if order belongs to someone else & is first time scanning the order
      if (!flag) {
        //if scanning first time order but order belongs to logged in user or anonymous
        let yesterdayDate = moment()
          .subtract(1, "days")
          .format(process.env.YYYYMMDD);
        let date_sent_to_device_check = moment(new Date()).format(
          process.env.YYYYMMDD
        );
        if (store != null || undefined) {
          if (store.show_yesterdays_orders_too == 1) {
            //code for getting yesterday date
            date_sent_to_device_check = moment()
              .subtract(1, "days")
              .format(process.env.YYYYMMDD);
          }
        }
        //preparing query for fetching orders of user
        if (user.load_in_late_orders_too != 1) {
          query_for_user_orders = {
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
              {
                datetime_created: {
                  $lt: moment(new Date())
                    .add(1, "days")
                    .format(process.env.YYYYMMDD),
                },
              },
            ],
          };
        } else {
          query_for_user_orders = {
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
            ],
          };
        }
        //query for getting unassigned orders
        query_for_unassigned_orders = {
          store_id: user.store_id,
          visited: { $ne: 1 },
          route_started: { $eq: null },
          driver_string: { $eq: null },
          datetime_created: {
            $gte: moment().subtract(1, "days").format(process.env.YYYYMMDD),
          },
        };
        //change in datetime_created if load_in_late_orders_too is not eq to one
        if (user.load_in_late_orders_too != 1) {
          query_for_unassigned_orders = {
            store_id: user.store_id,
            visited: { $ne: 1 },
            route_started: { $eq: null },
            driver_string: { $eq: null },

            $and: [
              {
                datetime_created: {
                  $gte: moment()
                    .subtract(1, "days")
                    .format(process.env.YYYYMMDD),
                },
              },
              {
                datetime_created: {
                  $lt: moment().add(1, "days").format(process.env.YYYYMMDD),
                },
              },
            ],
          };
        }
        //pass queries and other values and if func return false then skip thsi else through response oldest order exist
        let found_old_order = await check_oldest(
          store.old_order_time,
          yesterdayDate,
          order,
          store.check_for_old_orders_first,
          query_for_user_orders,
          query_for_unassigned_orders
        );
        if (found_old_order) {
          return res.status(302).send({
            status: success_status,
            statusCode: 302,
            type: "alert",
            title:
              found_old_order_msg +
              " " +
              found_old_order.fname +
              " " +
              found_old_order.lname,
            message: admin_msg,
          });
        }

        let order_is_old = check_if_order_is_old(
          store.check_if_order_is_too_old,
          order,
          store.old_order_time
        );
        if (order_is_old) {
          return res.status(200).send({
            status: failed_status,
            statusCode: 303,
            type: "alert",
            title: order_is_old_msg + parseInt(old_order_time / 3600),
            error: admin_msg,
          });
        }

        let order_is_young = check_if_order_is_young(
          store.check_if_order_is_too_young,
          store.young_order_time,
          order
        );
        if (order_is_young) {
          return res.status(200).send({
            status: failed_status,
            statusCode: 303,
            type: "alert",
            title: order_is_young_msg,
            error: admin_msg,
          });
        }
      }
    } else {
      //old app requirement when strict_box_scan_in ==1 then only through this response
      if (store.strict_box_scan_in == 1) {
        return res.status(404).send({
          status: failed_status,
          found: not_found,
          statusCode: 403,
          type: "alert",
          title: already_scanned,
          error: already_scanned_msg + " " + order.fname,
        });
      }
    }
    let total_box_scan = await Orders.findOne({
      store_id: storeId,
      order_id: orderId,
    });
    responseObj.case_desc = "Box scanned in";
    responseObj.message = box_scan_msg_success;
    responseObj.boxscanned = total_box_scan.boxes_scanned_in;
    //console.log(total_box_scan.boxes_scanned_in);
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      type: "grid",
      title: box_scan_success,
      message: responseObj,
      data: order,
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .send({ status: failed_status, statusCode: 500, error: err });
  }
};

/**
 *   @swagger
 *   components:
 *   schemas:
 *     manully_confirm:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: order id
 *         reason:
 *           type: string
 *           description: reason for manully confirm order
 *       example:
 *           orderId: 975
 *           reason: Barcode is damaged
 *
 */
/**
 * @swagger
 * /orders/manullyconfirm:
 *   put:
 *     summary: manully confirm order
 *     tags: [orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/manully_confirm'
 *     responses:
 *       200:
 *         description: order confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/manully_confirm'
 *       403:
 *         description: invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/manully_confirm'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/manully_confirm'
 *     security:
 *       - bearerAuth: []
 */

exports.manullyConfirmOrder = async (req, res) => {
  let success_status,
    failed_status,
    invaild_orderId,
    not_allowed,
    choose_reason,
    order_assigned_success,
    statusMatch;
  let reason = req.body.reason;
  let userId = req.user.userId;
  let flag = req.body.flag ?? false
  let reasonArray = [];
  let refusedStatus = [
    "SCANNED_OUT",
    "MANUALLY_SCANNED_OUT",
    "MANUALLY_DELIVERED",
  ];
  try {
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
    order_assigned_success =
      user.Language == 1
        ? process.env.ORDER_ASSIGNED_SUCCESS_ENGLISH
        : process.env.ORDER_ASSIGNED_SUCCESS_SPANISH;
    invaild_orderId =
      user.Language == 1
        ? process.env.ERROR_MSG_ENGLISH
        : process.env.ERROR_MSG_SPANISH;
    not_allowed =
      user.Language == 1
        ? process.env.NOT_ALLOWED_SWIPE_CONFIRM_ENGLISH
        : process.env.NOT_ALLOWED_SWIPE_CONFIRM_SPANISH;
        choose_reason =
        user.Language == 1
          ? process.env.CHOOSE_REASON_ENGLISH
          : process.env.CHOOSE_REASON_SPANISH;
        
    //fetching order
    let updated_order = await Orders.findOne({
      order_id: req.body.orderId,
    });
    //checking if null
    if (updated_order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
      //getting reason arr
      const reasons = await Reason.find()
      reasons.forEach(reason => {
        if(reason.type == "CONFIRM") {
          reasonArray.push(reason.text)
        }
      })
    //when flag is true & user did not send any reason then ask user to choose a reason
    if (flag && !reason) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: choose_reason,
        data: reasonArray
      });
    }
    //checking if refused status matched or not
    statusMatch = checkBoxStatus(refusedStatus, updated_order.boxes);
//if disallow_swipe_order_confirm is 1 
    if (user.disallow_swipe_order_confirm == 1) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: not_allowed,
      });
      //if is_scanning or is_segueing not eq to 1 then confirm with reason
    } else if (user.is_scanning != 1 || user.is_segueing != 1) {
      //checking if order contain any boxes or not
      if (updated_order.boxes.length !== 0 && !statusMatch) {
        for (i = 0; i < updated_order.boxes.length; i++) {
          updated_order.boxes[i].status.type = "MANUALLY_CONFIRMED";
            updated_order.boxes[i].status.description =
              "Box manually confirmed by non scanning user.";
          updated_order.boxes[i].status.driver_id = req.user.userId;
        }
        updated_order.save();
        res.status(200).send({
          status: success_status,
          statusCode: 200,
          message: order_assigned_success,
          data: updated_order.boxes,
        });
      } else {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          error: invaild_orderId,
        });
      }
    } else  { 
      //if both condition not match then we will ask user to choose resaon from reason array
      if(!flag) {
      
        return res.status(200).send({
          status: success_status,
          statusCode: 200,
          message: choose_reason,
          data: reasonArray,
        });
      } else {
        // in this block means user have choosed reason 
        if (updated_order.boxes.length !== 0 && !statusMatch) {
          for (i = 0; i < updated_order.boxes.length; i++) {
            updated_order.boxes[i].status.type = "MANUALLY_CONFIRMED";
            if (reason == undefined) {
              updated_order.boxes[i].status.description =
                "Box manually confirmed by non scanning user.";
            } else {
              updated_order.boxes[i].status.description =
                "Box is manually confirmed. The driver's reason: " + reason;
            }
    
            updated_order.boxes[i].status.driver_id = req.user.userId;
          }
          updated_order.save();
          res.status(200).send({
            status: success_status,
            statusCode: 200,
            message: order_assigned_success,
            data: updated_order.boxes,
          });
        } else {
          return res.status(404).send({
            status: failed_status,
            statusCode: 404,
            error: invaild_orderId,
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
/**
 *   @swagger
 *   components:
 *   schemas:
 *     reset_order:
 *       type: object
 *       required:
 *         - orderId
 *         - storeId
 *       properties:
 *         orderId:
 *           type: string
 *           description: order id
 *         storeId:
 *           type: string
 *           description: store id
 *       example:
 *           orderId: "99987010934"
 *           storeId: 24
 *
 */
/**
 * @swagger
 * /orders/resetorder:
 *   put:
 *     summary: this endpoint is used when user scan someone else's order and don't want to keep it or scans order but then closes app without start delivery
 *     tags: [orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/reset_order'
 *     responses:
 *       200:
 *         description: order reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/reset_order'
 *       403:
 *         description: invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/reset_order'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/reset_order'
 *     security:
 *       - bearerAuth: []
 */

exports.resetOrder = async (req, res) => {
  let success_status, failed_status, order_reset_success, invaild_orderId;
  let userId = req.user.userId;
  try {
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
    order_reset_success =
      user.Language == 1
        ? process.env.ORDER_RESET_SUCCESS_ENGLISH
        : process.env.ORDER_RESET_SUCCESS_SPANISH;
    invaild_orderId =
      user.Language == 1
        ? process.env.ERROR_MSG_ENGLISH
        : process.env.ERROR_MSG_SPANISH;

    const orderId = req.body.orderId;
    const storeId = req.body.storeId;
    //looping to update each box with driver id
    let updated_order = await Orders.findOne({
      order_id: orderId,
      store_id: storeId,
    });
    if (updated_order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
    let order_boxes = updated_order.boxes;
    // getting all boxIds and store them in array

    if (order_boxes.length != 0) {
      for (i = 0; i < order_boxes.length; i++) {
        order_boxes[i].status.type = "IN_STORE";
        order_boxes[i].status.description =
          "Order has been placed. Box status has not been updated yet.";
        order_boxes[i].status.driver_id = null;
      }
      updated_order.boxes_scanned_in = 0;
      updated_order.save();
      res.status(200).send({
        status: success_status,
        statusCode: 200,
        message: order_reset_success,
        data: updated_order.boxes,
      });
    } else {
      res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: "empty boxes array",
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

function checkBoxStatus(statusArray, boxes) {
  //console.log(statusArray);
  statusArray.forEach((status) => {
    boxes.forEach((box) => {
      if (status == box.status.type) {
        return true;
      }
    });
  });
  return false;
}

async function check_oldest(
  old_order_time,
  yesterday_date,
  current_order,
  check_for_old_orders_first,
  query_for_user_orders,
  query_for_unassigned_orders
) {
  let test_order = true,
    boxes_of_old_order,
    oldest_order;
  //checking if check_for_old_orders_first is allowed by store or not

  if (current_order != undefined && check_for_old_orders_first == 1) {
    console.log("check_for_old_orders_first");
    //getting user orders and unassigned orders
    let userOrders = await Orders.find(query_for_user_orders);

    let unAssignedOrders = await Orders.find(query_for_unassigned_orders);

    let allOrders = [...userOrders, ...unAssignedOrders];

    //filter all orders according to createdAt date with today date
    allOrders = allOrders.filter((order) => {
      return order.createdAt > yesterday_date;
    });

    allOrders = allOrders.filter((order) => {
      return order.hidden != 1;
    });
    //sorting all orders according to createdAt date
    allOrders.sort(function (order1, order2) {
      return new Date(order1.createdAt) - new Date(order2.createdAt);
    });
    //checking if allOrders array have any data or not
    if (allOrders.length != 0) {
      let oldest_order = allOrders[allOrders.length - 1];
      // console.log(oldest_order);
      //fetching oldest_ordertime of allOrders array and converting it into date
      oldest_ordertime = new Date(oldest_order.createdAt);

      //fetching this_ordertime and converting it into date
      this_ordertime = new Date(current_order.createdAt);

      //fetching old_order_time from store and adding it with current date
      considered_old = new Date(new Date().setSeconds(old_order_time));

      //getting intervals
      interval1 =
        (this_ordertime.getTime() - oldest_ordertime.getTime()) / 1000 / 60;
      interval2 =
        (considered_old.getTime() - oldest_ordertime.getTime()) / 1000 / 60;
      console.log(interval1, interval2);

      let boxes_of_old_order = oldest_order.boxes;
      //checking if oldest order already got scanned or not
      if (boxes_of_old_order != undefined && boxes_of_old_order.length != 0) {
        boxes_of_old_order.forEach((box) => {
          if (box.status.type == ("SCANNED_IN" || "MANUALLY_CONFIRMED")) {
            test_order = false;
            console.log("test_order = false");
          }
        });
      }

      if (
        test_order == true &&
        current_order._id != oldest_order._id &&
        interval1 > 15 &&
        interval2 > 0
      ) {
        console.log("oldest");
        return oldest_order;
      } else {
        return false;
      }
    }
  }
}

function check_if_order_is_old(
  check_if_order_is_too_old,
  current_order,
  old_order_time
) {
  if (check_if_order_is_too_old == 1) {
    let this_ordertime = new Date(current_order.createdAt);
    let considered_old = old_order_time;
    interval2 =
      (new Date(new Date()).getTime() - this_ordertime.getTime()) / 1000;
    if (interval2 > considered_old) {
      return true;
    } else {
      return false;
    }
  }
}

function check_if_order_is_young(
  check_if_order_is_too_young,
  young_order_time,
  current_order
) {
  //checking if check_if_order_is_too_young ==1 or not
  if (check_if_order_is_too_young == 1) {
    let considered_young = parseInt(young_order_time) * 60;
    let this_ordertime = new Date(current_order.createdAt ?? new Date());

    //fetching old_order_time from store and subtract it with considered_young which is multi of young_order_time
    let allowed_created_young = new Date(
      this_ordertime.setSeconds(-considered_young)
    );

    let this_order_hidden = new Date(current_order.hide_until ?? new Date());

    let allowed_hidden_young = new Date(
      this_order_hidden.setSeconds(-considered_young)
    );

    if (
      new Date() < allowed_hidden_young ||
      new Date() < allowed_created_young
    ) {
      return true;
    } else {
      return false;
    }
  }
}
