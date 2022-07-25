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
      { $and: [{ order_id: req.body.orderId }, { user_id: req.user.userId }] },
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
 *         - barcodeTestString
 *       properties:
 *         barcodeTestString:
 *           type: string
 *           description: raw barcode of box
 *       example:
 *           barcodeTestString: "9998701093402"
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
    failed_status,
    order_assigned_success,
    invaild_orderId,
    statusMatch = false;
  let userId = req.user.userId,
    flag = false;
  let store, storeId, orderId, boxNumber;
  let components = [],
    buchbarcode,
    barcodeTestString = req.body.barcodeTestString;
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
      }
    );
    store.check_if_order_is_too_old = store.check_if_order_is_too_old ?? 0;
    store.check_for_old_orders_first = store.check_for_old_orders_first ?? 0;
    store.old_order_time = store.old_order_time ?? 0;
    console.log(store.old_order_time ?? 0);
    switch (store.barcode_type) {
      case "RDT":
        components = [];
        components = barcodeTestString.split("/");
        break;
      case "CMP":
        components = [];
        let numberTest = barcodeTestString[0];
        if (parseInt(numberTest) != null) {
        } else {
          barcodetesting = barcodeTestString.substring(1);
        }
        components = barcodetesting.split("-") ?? [];
        components.unshift(store.store_id);
        break;
      case "BUC":
        components = [];
        buchbarcode = barcodeTestString.slice(0, -2);
        if (buchbarcode[0] == 0) {
          buchbarcode = buchbarcode.substring(1);
        }
        components.push(store.store_id);
        components.push(buchbarcode);
        if (barcodeTestString.length > 2) {
          components.push(
            barcodeTestString.substring(barcodeTestString.length - 2)
          );
        }
        break;
      case "STCR":
        components = [];
        buchbarcode = barcodeTestString.slice(0, -2);
        components.push(store.store_id);
        components.push(buchbarcode);
        if (barcodeTestString.length > 2) {
          components.push(
            barcodeTestString.substring(barcodeTestString.length - 2)
          );
        }
        break;
      case "MICRO":
        components = [];
        components.push(store.store_id);
        buchbarcode = barcodeTestString;
        if (buchbarcode.includes("RX")) {
          buchbarcode = barcodeTestString.slice(0, -2);
        }
        components.push(buchbarcode);
        components.push("01");
        break;
      case "RX30":
        components = [];
        components.push(store.store_id);
        if (barcodeTestString.length > 8) {
          let barcodeTestString2 = barcodeTestString.substring(4);
          barcodeTestString2 = barcodeTestString2.slice(0, -1);
          components.push(barcodeTestString2);
        } else {
          components.push(barcodeTestString.slice(0, -2));
        }
        components.push("01");
        break;
      case "IKON":
        components = [];
        components = barcodeTestString.split("-");
        components.unshift(store.store_id);
        components.push("-01");
        break;
      default:
        components = [];
        components.unshift(store.store_id);
        components.push(barcodeTestString);
        components.push("-01");
        break;
    }

    if (barcodeTestString.length < store.barcode_minimum) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error:
          "Invalid barcode barcode length is less then logged in user's store's minimum length of barcode",
      });
    } else if (
      store.barcode_type == "RDT" &&
      barcodetesting.includes("/") == false
    ) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: "Invalid barcode",
      });
    } else {
      if (components.length != 3) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          error: "Invalid barcode please scan again barcode is not complete",
        });
      } else if (user.store_id != components[0]) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          error: "Invalid barcode does not match logged in user's store",
        });
      } else if (components[2] == null) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          error: "Invalid barcode",
        });
      }
    }
    storeId = components[0];
    orderId = components[1];
    boxNumber = parseInt(components[2]);
    const order = await Orders.findOne({
      store_id: storeId,
      order_id: orderId,
    });
    //if order is null
    if (order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: "Invalid barcode",
      });
    } else if (order.boxes.length == 0) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: "Invalid barcode empty boxes",
      });
    }
    if (
      req.user.userId == order.boxes[boxNumber - 1].status.driver_id && //check if box which we are scanning is also scanned in &
      order.boxes[boxNumber - 1].status.type ==
        ("SCANNED_IN" || "MANUALLY_CONFIRMED") //the driver id is also same as logged in user id
    ) {
      return res.status(400).send({
        status: failed_status,
        statusCode: 400,
        error: "DUPLICATE SCAN",
      });
    }
    //if box number is zero throw error
    if (boxNumber == 0) {
      return res.status(400).send({
        status: failed_status,
        statusCode: 400,
        error: "BOX NUMBER IS ZERO",
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
    if (order.boxes.length !== 0 && statusMatch && order.status == 0) {
      order.boxes[boxNumber - 1].status.type = "SCANNED_IN";
      order.boxes[boxNumber - 1].status.description = "Box scanned in";
      order.boxes[boxNumber - 1].status.driver_id = req.user.userId;

      order.save();
      console.log(order.user_id.length);
      if (
        req.user.userId != order.user_id &&
        req.user.userId != undefined &&
        order.user_id.length != 0 &&
        !flag
      ) {
        return res.status(200).send({
          status: success_status,
          statusCode: 200,
          error:
            "Not your order!  The order you just scanned:" +
            order.driver_string +
            "is not assigned to you.",
        });
      } else if (!flag) {
        console.log("check old orders");
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
        let found_old_order = check_oldest(
          store.old_order_time,
          yesterdayDate,
          order,
          store.check_for_old_orders_first,
          query_for_user_orders,
          query_for_unassigned_orders
        );
        if (found_old_order === true) {
          return res.status(200).send({
            status: success_status,
            statusCode: 200,
            data: found_old_order,
            message: "Please scan oldest undelivered order",
          });
        }

        let order_is_old = check_if_order_is_old(
          store.check_if_order_is_too_old,
          order,
          store.old_order_time
        );
        if (order_is_old) {
          return res.status(200).send({
            status: success_status,
            statusCode: 200,
            data: found_old_order,
            message: "ORDER OLDER THAN " + parseInt(old_order_time / 3600),
          });
        }
      }
    } else {
      //old app requirement when strict_box_scan_in ==1 then only through this response
      if (store.strict_box_scan_in == 1) {
        return res.status(404).send({
          status: failed_status,
          statusCode: 404,
          error: "This box has already been scanned out in past!",
        });
      }
    }
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      data: order.boxes,
      message: "you scanned order successfully",
    });
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
    order_assigned_success,
    statusMatch;
  let reason = req.body.reason;
  let userId = req.user.userId;
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
    //fetching order
    let updated_order = await Orders.findOne({
      order_id: req.body.orderId,
      user_id: req.user.userId,
    });
    //checking if null
    if (updated_order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
    //checking if refused status matched or not
    statusMatch = checkBoxStatus(refusedStatus, updated_order.boxes);
    //checking if order contain any boxes or not
    if (updated_order.boxes.length !== 0 && !statusMatch) {
      for (i = 0; i < updated_order.boxes.length; i++) {
        updated_order.boxes[i].status.type = "MANUALLY_CONFIRMED";
        if (reason == undefined) {
          updated_order.boxes[i].status.description =
            "Box manually confirmed by non scanning user.";
        } else {
          updated_order.boxes[i].status.description =
            "Box is manually confirmed. The driver's reason:" + reason;
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
  } catch (err) {
    console.log(err);
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

    const orderId = req.body.orderId;
    const driverId = req.user.userId;
    let boxIds = [];
    //fetching orders according to id

    //looping to update each box with driver id
    let updated_order = await Orders.findOne({ order_id: orderId });
    if (updated_order == null) {
      return res.status(404).send({
        status: failed_status,
        statusCode: 404,
        error: invaild_orderId,
      });
    }
    // getting all boxIds and store them in array
    if (updated_order.boxes.length !== 0) {
      for (i = 0; i < updated_order.boxes.length; i++) {
        boxIds.push(updated_order.boxes[i]._id);
      }

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
  console.log(check_for_old_orders_first);
  console.log("check_for_old_orders_first");
  if (current_order != undefined && check_for_old_orders_first == 1) {
    //getting user orders and unassigned orders
    let userOrders = await Orders.find(query_for_user_orders);

    let unAssignedOrders = await Orders.find(query_for_unassigned_orders);

    allOrders = [...userOrders, ...unAssignedOrders];

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
      oldest_order = allOrders[allOrders.length - 1];
      //fetching oldest_ordertime of allOrders array and converting it into date
      oldest_ordertime = new Date(oldest_order.createdAt);
      //fetching this_ordertime and converting it into date
      this_ordertime = new Date(current_order.createdAt);
      //fetching old_order_time from store and adding it with current date
      considered_old = new Date(new Date().setSeconds(old_order_time));
      //getting intervals
      interval1 =
        (this_ordertime.getTime() - oldest_ordertime.getTime()) / 1000;
      interval2 =
        (considered_old.getTime() - oldest_ordertime.getTime()) / 1000;

      boxes_of_old_order = oldest_order.boxes;
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
  young_order_time
) {
  if (check_if_order_is_too_young == 1) {
    considered_young = parseInt(young_order_time) * 60;
  }
}
