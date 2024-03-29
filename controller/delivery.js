const User = require("../model/user");
const Orders = require("../model/orders");
const Store = require("../model/store");
const Language = require("../model/language");
const moment = require("moment");
const lodash = require("lodash");
var axios = require("axios");
const BarcodeFormat = require("../model/barcodeformat");
const {
  start_delivery_manually_confirm,
  check_similar_address,
  admin_override_order,
  driverSteps,
} = require("../shared/delivery");
const Reason = require("../model/reason");
let {
  uniqueorders,
  unvisitedorders,
  removeOrdersAtCancelRoute,
  markDeliveredAtCancelRoute,
  saveForFutureDeliveryCancelRoute,
} = require("../shared/orders");

/**
 *   @swagger
 *   components:
 *   schemas:
 *     start_delivery:
 *       type: object
 *       required:
 *         - orderIds
 *       properties:
 *         orderIds:
 *           type: Array
 *           description: array of order ids
 *       example:
 *           orderIds: ["99574783430","9957478343990"]
 */
/**
 * @swagger
 * /delivery:
 *   post:
 *     summary: start delivery after scanning all orders
 *     tags: [delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/start_delivery'
 *     responses:
 *       200:
 *         description: Returns new token for authorization
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
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.startDelivery = async (req, res) => {
  let userId = req.user.userId;
  let orderIds = req.body.orderIds ?? [];
  let query;
  let unVisitedOrders = [],
    unVisitedUniqueOrders = [],
    uniqueOrders = [];
  let password = req.body.password;
  let allow_manully_confirm = req.body.manullyConfirm ?? false;
  let admin_override = req.body.adminOverride ?? false;
  let similar_address = req.body.similarAddress ?? false;
  let responseObj;
  let missingBoxes = "";
  let notConfirmedBoxes = false;
  let failedStatus;
  let acceptedStatus = ["IN_STORE", "RETURNED", "MANUALLY_DELETED"];
  let confirmedStatus = [
    "SCANNED_IN",
    "MANUALLY_CONFIRMED",
    "SCANNED_OUT",
    "MANUALLY_SCANNED_OUT",
    "MANUALLY_DELIVERED",
  ];
  let date_sent_to_device_check = moment(new Date()).format(
    process.env.YYYYMMDD
  );
  let datetime_created_check = moment(new Date())
    .add(1, "days")
    .format(process.env.YYYYMMDD);
  try {
    const user = await User.findOne({ _id: userId });
    user.is_segueing = user.is_segueing ?? 0;
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    //if load_in_late_orders_too is undefined then set zero

    user.load_in_late_orders_too = user.load_in_late_orders_too ?? 0;
    user.starting_point = user.starting_point ?? 0;
    user.no_gps = user.no_gps ?? 0;

    if (orderIds.length == 0) {
      return res.status(404).send({
        status: langObj.success_status_text,
        statusCode: 404,
        error: "orderIds array is empty",
      });
    }
    //step 1
    //fetching store doc of logged in user
    let store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        store_id: "store_id",
        days_in_past_to_import: "days_in_past_to_import",
        confirm_orders_no_swipe: "confirm_orders_no_swipe",
        disallow_missing_boxes: "disallow_missing_boxes",
        check_similar_street: "check_similar_street",
        check_similar_address: "check_similar_address",
        admin_pass: "admin_pass",
      }
    );
    store.disallow_missing_boxes = store.disallow_missing_boxes ?? 0;
    store.days_in_past_to_import = store.days_in_past_to_import ?? 1;
    store.confirm_orders_no_swipe = store.confirm_orders_no_swipe ?? 0;
    store.check_similar_address = store.check_similar_address ?? 0;
    store.check_similar_street = store.check_similar_street ?? 0;
    store.admin_pass = store.admin_pass ?? 0;
    //checking if show_yesterdays_orders_too ==1 and if it is eq to one then also load yesterday orders
    if (store != null || undefined) {
      if (store.show_yesterdays_orders_too == 1) {
        //code for getting yesterday date
        date_sent_to_device_check = moment()
          .subtract(store.days_in_past_to_import, "days") // how much old orders want to show store can tell
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
    // getting all order assign by admin to if admin has assigned new order to driver or not
    let orders = await Orders.find(query);

    //fetching all those orders that user has scanned and got from admin panel
    let allOrders = await Orders.find({ order_id: { $in: orderIds } });
    // checking if in admin orders we have such order which is not available but not in user orders
    let uniqueResult = orders.filter(function (obj) {
      return !allOrders.some(function (obj2) {
        return obj.order_id == obj2.order_id;
      });
    });
    allOrders = [...allOrders, ...uniqueResult];
    langObj.additional_orders_heading_text =
      langObj.additional_orders_heading_text.replace(
        "$number",
        uniqueResult.length
      );
    //if new orders are available then send all order and msg
    if (uniqueResult.length !== 0) {
      return res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        responseObj: {
          heading: langObj.additional_orders_heading_text,
          content: langObj.additional_orders_content_text,
        },
        data: allOrders,
      });
    }

    //step 2

    if (store.confirm_orders_no_swipe != 1) {
      allOrders.forEach((order) => {
        order.boxes.forEach((box) => {
          //if current box of order contains status which is present in acceptedStatus then show alert
          if (acceptedStatus.includes(box.status.type)) {
            missingBoxes += ` Box # ${box.number}, ${order.fname} ${order.street_address} order #:${order.order_id}`;
            notConfirmedBoxes = true;
          }
        });
      });
    }
    //here we check if anyone box had acceptedStatus
    if (
      notConfirmedBoxes &&
      store.disallow_missing_boxes != 1 &&
      !allow_manully_confirm &&
      !admin_override
    ) {
      responseObj = {
        status: langObj.failed_status_text,
        statusCode: 400,
        isSegueing: user.is_segueing,
        heading: langObj.box_not_scanned_heading_text + missingBoxes,
        missingBoxes: missingBoxes,
        content: langObj.box_not_scanned_content_text,
        option1: langObj.box_not_scanned_option_1_text,
        option2: langObj.box_not_scanned_option_2_text,
        option3: langObj.box_not_scanned_option_3_text,
      };

      return res
        .status(400)
        .send({ status: failedStatus, statusCode: 400, responseObj });
    }
    //allow_manully_confirm is a flag and it would be true when user select option i can't scan boxes
    if (allow_manully_confirm) {
      // if (user.is_segueing == 1) {
      //   const reasons = await Reason.find();
      //   reasons.forEach((reason) => {
      //     if (reason.type == "CONFIRM") {
      //       confirmReasons.push(reason.text);
      //     } else if (reason.type == "UNCONFIRM") {
      //       unConfirmReasons.push(reason.text);
      //     }
      //   });
      //   return res.status(400).send({
      //     status: failedStatus,
      //     statusCode: 400,
      //     message: missingBoxes,
      //     confirmReason: confirmReasons,
      //     unConfirmReason: unConfirmReasons,
      //   });
      // } else {
      //this else block will work when user selected option "i can't scan orders"
      allOrders = start_delivery_manually_confirm(
        allOrders,
        confirmedStatus,
        req.user.userId
      );
      // }
    }
    if (admin_override && user.Language == 1 && !password) {
      return res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        message: {
          heading: langObj.admin_override_text,
          content: langObj.enter_password_text,
        },
      });
    } else if (admin_override && password) {
      adminResponse = admin_override_order(
        allOrders,
        password,
        store.admin_pass,
        confirmedStatus,
        userId
      );
      if (adminResponse) {
        allOrders = adminResponse;
      } else {
        return res.status(404).send({
          status: langObj.success_status_text,
          statusCode: 404,
          error: {
            title: langObj.wrong_password_text,
            heading: langObj.admin_override_text,
            content: langObj.enter_password_text,
          },
        });
      }
    }
    if (
      store.check_similar_street == 1 ||
      (store.check_similar_address == 1 && !similar_address)
    ) {
      let result = await check_similar_address(
        allOrders,
        store.check_similar_address,
        store.check_similar_street,
        Orders,
        store.store_id,
        langObj
      );
      //if we found any similar address then slow alert
      if (result) {
        allOrders = [...allOrders, result.data]; // adding order got from similar address
        delete result["data"];
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          type: "alert",
          message: result,
          data: allOrders,
        });
      }
    }

    uniqueOrders = uniqueorders(allOrders);
    unVisitedOrders = unvisitedorders(allOrders);
    unVisitedUniqueOrders = uniqueOrders.filter((order) => {
      return order.visited != 1;
    });
    if (user.no_gps == 1) {
      allOrders.map((order) => (order.sequence = order.order_id));
      allOrders = lodash.orderBy(allOrders, ["sequence"], ["asc"]);
    }
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      NO_GPS: user.no_gps,
      data: {
        allOrders,
        uniqueOrders,
        unVisitedOrders,
        unVisitedUniqueOrders,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
exports.confirmBoxAtStartDelivery = async (req, res) => {
  let confirmReason = req.body.confirmReason || undefined,
    unConfirmReason = req.body.unConfirmReason || undefined;
  let orderId = req.body.orderId;
  let boxNo = req.body.boxNo;
  boxNo = parseInt(boxNo);
  let flag = false;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const order = await Orders.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    order.boxes.forEach((box) => {
      if (box.number == boxNo) {
        flag = true;
        if (confirmReason) {
          box.status.type = "MANUALLY_CONFIRMED";
          box.status.driver_id = req.user.userId;
          box.status.description =
            "Box is manually confirmed. The driver's reason: " + confirmReason;
        } else if (unConfirmReason) {
          box.status.type = "NOT_CONFIRMED";
          box.status.driver_id = req.user.userId;
          box.status.description =
            "Driver didn't take the box. The driver's reason: " +
            unConfirmReason;
        }
        order.boxes_scanned_in = order.boxes_scanned_in + 1 ?? 1;
        order.save();
        res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          data: order,
        });
      }
    });

    if (!flag) {
      res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.missing_box_heading_text,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
exports.updateOrders = async (req, res) => {
  const orderIds = req.body.orderIds;
  let userId = req.user.user_id;
  let failedStatus;
  try {
    const user = await User.findOne({ _id: userId });
    user.is_segueing = user.is_segueing ?? 0;
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const orderNo = await Orders.find({
      store_id: user.store_id,
      order_id: { $in: orderIds },
      visited: { $ne: 1 },
    }).countDocuments();
    const orders = await Orders.find({
      store_id: user.store_id,
      order_id: { $in: orderIds },
    });
    let presortedOrder = orders.map((order) => {
      return order.presorted == 1;
    });
    for (index = 0; index < orderIds.length; index++) {
      const order = await Orders.findOne({
        store_id: user.store_id,
        order_id: orderIds[index],
      });
      if (!order) {
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 404,
          error: langObj.invalid_order_id_text,
        });
      }

      order.user_id = req.user.user_id;
      order.driver_string = user.driver_string;
      order.deleted_from_device = 0;
      if (orderNo == 0) {
        let original_route_started = moment(new Date()).format(
          "yyyy-MM-dd-HH:mm:ss"
        );
        order.route_started = original_route_started;
        if (presortedOrder.length !== 0) {
          order.sequence = index + 1;
        }
      }
      if (
        order.boxes_scanned_in != order.total_boxes &&
        user.orders_entry_method == 1
      ) {
        order.has_problem = 1;
      }
      order.save();
    }
    orders = await Orders.find({
      store_id: user.store_id,
      order_id: { $in: orderIds },
    });
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      data: orders,
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.user.userId;
  const longitude = req.body.longitude;
  const latitude = req.body.latitude;
  const total_addresses_in_run = req.body.totalAddressesInRun;
  const first_time = req.body.first_time;
  const original_route_started = req.body.originalRouteStarted;
  const etaDateForParse = req.body.etaDateForParse;
  const addresses_yet_to_visit = req.body.addressesYetToVisit;
  const orderId = req.body.orderId;
  let timeStamp = moment(new Date()).format("h:mm:ss a");
  try {
    const order = await findOne({ store_id: user.store_id, order_id: orderId });
    const user = await User.findOne({ _id: userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;

    user.last_location = [longitude, latitude];
    user.is_delivering = 0;
    user.total_addresses_in_run = total_addresses_in_run;
    if (first_time) {
      user.previous_stop = "Left the store to begin route";
      user.eta_to_store = etaDateForParse;
      user.original_route_started = original_route_started || null;
      user.started_driving = original_route_started || null;
    }

    user.addresses_yet_to_visit = addresses_yet_to_visit;
    if (order) {
      user.latest_action = `Was directed to drive to ${order.fname} at ${timeStamp}`;
      user.next_stop = `${order.fname} at ${order.street_address}`;
    } else {
      user.latest_action = `Was directed to drive back to store at ${timeStamp}`;
      user.next_stop =
        "When left his last stop ETA to store was " + etaDateForParse;
    }
    user.eta_to_store = etaDateForParse;
    user.save();
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      message: "user updated successfully",
    });
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

/**
 *   @swagger
 *   components:
 *   schemas:
 *     cancel_route:
 *       type: object
 *       required:
 *         - step
 *         - option
 *       properties:
 *         step:
 *           type: number
 *           description: please enter between 1, 2, 3
 *         option:
 *           type: number
 *           description: please enter of option yu have selected
 *         firstTime:
 *           type: boolean
 *           description: if first time is true means only messages related to step will be send
 *         orderIds:
 *           type: Array
 *           description: array of order ids
 *       example:
 *           step: 1
 *           firstTime: true
 *           option: 1
 *           orderIds: ["99574783430","9957478343990"]
 */
/**
 * @swagger
 * /delivery/cancelroute:
 *   post:
 *     summary: this api is used to cancel route of user or exist scanning page
 *     tags: [delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/cancel_route'
 *     responses:
 *       200:
 *         description: Returns new token for authorization
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
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.cancelRoute = async (req, res) => {
  let responseObj = {},
    failedStatus;
  let step = req.body.step;
  let firstTime = req.body.firstTime;
  let orderIds = req.body.orderIds ?? [];
  let stepType = req.body.stepType,
    stepString,
    longitude = req.body.longitude,
    latitude = req.body.latitude;
  let option = req.body.option;
  let etaForStore = req.body.etaForStore ?? new Date().toISOString();
  let password = req.body.password ?? undefined;
  try {
    //step 1
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    let store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        admin_pass: "admin_pass",
        sensitive_actions_require_pass: "sensitive_actions_require_pass",
        tauber_store_name: "tauber_store_name",
        tauber_entp: "tauber_entp",
      }
    );
    store.sensitive_actions_require_pass =
      store.sensitive_actions_require_pass ?? 1;
    store.admin_pass = store.admin_pass ?? "";
    if (step == 1) {
      responseObj.heading = langObj.cancel_route_before_delivery_heading_text;
      responseObj.content = langObj.cancel_route_before_delivery_content_text;
      responseObj.Option1 = langObj.cancel_route_before_delivery_option_1_text;
      responseObj.Option2 = langObj.cancel_route_before_delivery_option_2_text;
      responseObj.Option3 = langObj.cancel_route_before_delivery_option_3_text;
      responseObj.Option4 = langObj.cancel_route_before_delivery_option_4_text;
      if (firstTime) {
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: responseObj,
        });
      }
      if (option == 1) {
        user.next_stop = "Started scanning but canceled route";
        user.previous_stop = "Started scanning but canceled route";
        user.total_addresses_in_run = 0;
        user.addresses_yet_to_visit = 0;
        user.is_delivering = 0;
        user.save();
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: "user updated",
        });
      } else if (option == 2 || option == 3) {
        await Orders.updateMany(
          { store_id: user.store_id, order_id: { $in: orderIds } },
          {
            $set: {
              driver_string: user.driver_string,
              date_sent_to_device: moment(new Date()).format(
                "yyyy-MM-dd-HH:mm:ss"
              ),
            },
          }
        );
        if (option == 3) {
          user.next_stop = "Started scanning but canceled route";
          user.previous_stop = "Started scanning but canceled route";
          user.total_addresses_in_run = 0;
          user.addresses_yet_to_visit = 0;
          user.is_delivering = 0;
          user.save();
        }
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: "orders updateds",
        });
      }
    } else if (step == 2) {
      responseObj.heading = langObj.cancel_route_done_delivery_heading_text;
      responseObj.content = langObj.cancel_route_after_delivery_content_text;
      responseObj.Option1 = langObj.cancel_route_after_delivery_option_1_text;
      responseObj.Option2 = langObj.cancel_route_after_delivery_option_2_text;
      responseObj.Option3 = langObj.cancel_route_after_delivery_option_3_text;
      responseObj.Option4 = langObj.cancel_route_before_delivery_option_4_text;
      if (firstTime) {
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: responseObj,
        });
      }

      if (option == 1) {
        contentText =
          "Admin can let you mark all as delivered only by typing password:";
      } else if (option == 2) {
        contentText =
          "Admin can let you mark all as delivered but only by typing password:";
      } else if (option == 3) {
        contentText =
          "Admin can let you mark all as delivered but only by typing password:";
      }
      let orders = await Orders.find({
        store_id: user.store_id,
        order_id: { $in: orderIds },
      });
      if (option == 1 || option == 2) {
        if (store.sensitive_actions_require_pass == 1) {
          if (!password) {
            return res.status(200).send({
              status: langObj.success_status_text,
              statusCode: 200,
              heading: "PASSWORD REQUIRED!!",
              content: contentText,
            });
          } else if (password != store.admin_pass) {
            return res.status(400).send({
              status: langObj.success_status_text,
              statusCode: 200,
              heading: "WRONG PASSWORD!!",
              content: contentText,
            });
          }
        }
      }

      if (option == 1) {
        removeOrdersAtCancelRoute(orders, req.user.userId);
      } else if (option == 2) {
        if (store.tauber_store_name) {
          orderArr = orders.map((order) => {
            return {
              order_id: order.order_id,
              actually_delivered: moment(new Date()).format(
                "yyyy-MM-dd HH:mm:ss"
              ),
            };
          });
          var data = JSON.stringify({
            driver_name: user.driver_string,
            order_arr: orderArr,
            store_name: store.tauber_store_name,
            entp: store.tauber_entp,
          });

          var config = {
            method: "post",
            url: "http://connect.compudime.com:1337/parse/functions/set_get",
            headers: {
              "X-Parse-Application-Id": "delivery",
              "Content-Type": "application/json",
            },
            data: data,
          };

          axios(config)
            .then(function (response) {
              console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log(error);
            });
        }

        markDeliveredAtCancelRoute(
          orders,
          req.user.userId,
          latitude,
          longitude
        );
      } else if (option == 3) {
        saveForFutureDeliveryCancelRoute(
          orders,
          req.user.userId,
          user.driver_string
        );
      }
      user.is_delivering = 0;
      user.next_stop =
        "When left his last stop ETA was" +
        etaForStore +
        "  But he manually cancelled the route before returning!";
      user.save();
      return res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        message: "route canceled successfully",
      });
    } else if (step == 3) {
      responseObj.heading = langObj.cancel_route_done_delivery_heading_text;
      responseObj.content = langObj.cancel_route_done_delivery_content_text;
      responseObj.Option1 = langObj.cancel_route_done_delivery_option_1_text;
      responseObj.Option2 = langObj.cancel_route_done_delivery_option_2_text;
      responseObj.Option3 = langObj.cancel_route_done_delivery_option_3_text;
      responseObj.Option4 = langObj.cancel_route_done_delivery_option_4_text;
      responseObj.Option5 = langObj.cancel_route_before_delivery_option_4_text;
      if (firstTime) {
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: responseObj,
        });
      }
      if (option == 1) {
      } else if (option == 2) {
        stepString =
          'Driver finished delivering and when prompted to return to store he chose "I do not wish to return to the store now"';
      } else if (option == 3) {
        stepString =
          'Driver finished delivering and when prompted to return to store he chose "I am going out for lunch now"';
      } else if (option == 4) {
        stepString =
          'The driver finished delivering and when prompted to return to store he chose "I am back at the store already"';
      }
      driverSteps(stepType, stepString, user, longitude, latitude);
      user.is_delivering = 0;
      user.next_stop =
        "When left his last stop ETA was" +
        etaForStore +
        "  But he manually cancelled the route before returning!";
      user.save();
      return res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        message: "route canceled successfully",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.scanOrderForBeginDelivery = async (req, res) => {
  let barcode_arr = [];
  let components = [],
    splitWith = [];
  let store, failedStatus;
  let rawData = req.body.rawData ?? undefined;
  let orderIds = req.body.orderIds ?? [];
  let flag = false;
  let barcodeMatched = false;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
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
        admin_pass: "admin_pass",
        searchby_sub: "searchby_sub",
      }
    );
    store.searchby_sub = store.searchby_sub ?? 0;

    //converting rawData into string in case front end send it as number
    rawData = rawData.toString();

    //getting barcode format from db
    var barcodeFormats = await BarcodeFormat.find();
    barcodeFormats = JSON.parse(JSON.stringify(barcodeFormats));
    // console.log({barcodeFormats});

    var barcodeFormatBUCH = {};
    //to change position of BUCH format first store BUCH obj in var barcodeFormatBUCH
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUC") {
        barcodeFormatBUCH = barcodeFormat;
      }
    });
    //then remove BUCH record from arr
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUC") {
        barcodeFormats.splice(i, i);
      }
    });

    //now push it to the array
    barcodeFormats.push(barcodeFormatBUCH);
    //adding values in splitWith & regex_arr & getting from barcode_format collection
    splitWith = barcodeFormats.map((value) => value.split_with);
    regex_arr = barcodeFormats.map((value) => value.regexformat);
    barcode_arr = barcodeFormats.map((value) => value.barcode_type);
    // for (index = 0; index < regex_arr.length; index++) {
    //   if (rawData.match(regex_arr[index]) !== null) {

    //looping over regex_arr arr and comparing rawData with regex
    for (index = 0; index < barcode_arr.length; index++) {
      if (store.barcode_type == barcode_arr[index]) {
        barcodeMatched = true;
        let regex = new RegExp(regex_arr[index]);
        // if this check pass then use split_with else check for length
        if (regex.test(rawData)) {
          console.log("pass");
          //coomparing regex with barcode
          if (!isNaN(splitWith[index])) {
            buchbarcode = rawData.slice(0, -splitWith[index]);
            components.push(buchbarcode);
            components.push(
              rawData.substring(rawData.length - splitWith[index])
            );
            //checking if barcode which matched with regex has stodeId in format or not if not then add
            if (!barcodeFormats[index].storeid_available) {
              components.unshift(store.store_id);
            }
            if (!barcodeFormats[index].boxno_avaiable) {
              components.push("01");
            }
          } else {
            components = rawData.split(splitWith[index]);
            //checking if barcode which matched with regex has stodeId in format or not if not then add
            if (!barcodeFormats[index].storeid_available) {
              components.unshift(store.store_id);
            }
            if (!barcodeFormats[index].boxno_avaiable) {
              components.push("01");
            }
          }

          break;
        } else {
          buchbarcode = rawData;
          //checking if db provides check_length and if provides, is it greter than rawData length
          if (
            !barcodeFormats[index].check_length ||
            rawData.length > barcodeFormats[index].check_length
          ) {
            if (
              barcodeFormats[index].drop_last &&
              barcodeFormats[index].drop_last[0] &&
              barcodeFormats[index].drop_last[0].true &&
              barcodeFormats[index].drop_last[0].true != 0
            ) {
              //if drop_last[0].true exist not zero then use slice
              buchbarcode = buchbarcode.slice(
                0,
                -barcodeFormats[index].drop_last[0].true
              );
            }
            if (
              barcodeFormats[index].drop_first &&
              barcodeFormats[index].drop_first[0] &&
              barcodeFormats[index].drop_first[0].true &&
              barcodeFormats[index].drop_first[0].true != 0
            ) {
              //if drop_first exist not zero then use slice
              buchbarcode = buchbarcode.slice(
                barcodeFormats[index].drop_first[0].true
              );
              //console.log(buchbarcode);
            }
          }
          //checking if db provides check_length and if provides, is it less than rawData length
          if (
            !barcodeFormats[index].check_length ||
            rawData.length < barcodeFormats[index].check_length
          ) {
            if (
              barcodeFormats[index].drop_last &&
              barcodeFormats[index].drop_last[1] &&
              barcodeFormats[index].drop_last[1].false &&
              barcodeFormats[index].drop_last[1].false != 0
            ) {
              buchbarcode = buchbarcode.slice(
                0,
                -barcodeFormats[index].drop_last[1].false
              );
            }
            if (
              barcodeFormats[index].drop_first &&
              barcodeFormats[index].drop_first[1] &&
              barcodeFormats[index].drop_first[1].false &&
              barcodeFormats[index].drop_first[1].false != 0
            ) {
              buchbarcode = buchbarcode.slice(
                barcodeFormats[index].drop_first[1].false
              );
            }
          }
          // console.log(buchbarcode);
          if (!barcodeFormats[index].storeid_available) {
            components.unshift(store.store_id);
          }
          components.push(buchbarcode);
          if (!barcodeFormats[index].boxno_avaiable) {
            components.push("01");
          }
          break;
        }
      }
    }
    if (!barcodeMatched) {
      switch (store.barcode_type) {
        case "MICRO":
          components = [];
          components.push(store.store_id);
          buchbarcode = rawData;
          if (buchbarcode.includes("RX")) {
            buchbarcode = rawData.slice(0, -2);
          }
          components.push(buchbarcode);
          components.push("01");
          break;
        case "RX30":
          components = [];
          components.push(store.store_id);
          if (rawData.length > 8) {
            let rawData2 = rawData.substring(4);
            rawData2 = rawData2.slice(0, -1);
            components.push(rawData2);
          } else {
            components.push(rawData.slice(0, -2));
          }
          components.push("01");
          break;
        default:
          components = [];
          components.unshift(store.store_id);
          components.push(rawData);
          components.push("-01");
          break;
      }
    }
    //checking box scanned
    if (rawData.length < store.barcode_minimum) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        type: "grid",
        title: langObj.invalid_barcode_heading_text,
        error: langObj.invalid_barcode_length_text,
      });
    } else if (store.barcode_type == "RDT" && rawData.includes("/") == false) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        type: "grid",
        title: langObj.invalid_barcode_heading_text,
        error: langObj.invalid_barcode_text,
      });
    } else {
      if (components.length != 3) {
        return res.status(406).send({
          status: langObj.failed_status_text,
          statusCode: 406,
          type: "grid",
          title: langObj.invalid_barcode_heading_text,
          error: langObj.uncomplete_barcode_text,
        });
      } else if (user.store_id != components[0]) {
        langObj.invalid_storeId_in_barcode_text =
          langObj.invalid_storeId_in_barcode_text.replace(
            "$barcodeData",
            rawData
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 402,
          type: "grid",
          title: langObj.warning_text,
          error: langObj.invalid_storeId_in_barcode_text,
        });
      } else if (components[2] == null) {
        langObj.missing_boxno_in_barcode_text =
          langObj.missing_boxno_in_barcode_text.replace(
            "$barcodeData",
            rawData
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 404,
          type: "grid",
          title: langObj.warning_text,
          error: langObj.missing_boxno_in_barcode_text,
        });
      }
    }
    const orders = await Orders.find({
      order_id: { $in: orderIds },
      store_id: user.store_id,
    });

    if (store.searchby_sub == 0) {
      orders.forEach((order) => {
        if (order.order_id == components[1]) {
          flag = true;
          return res.status(200).send({
            status: langObj.success_status_text,
            statusCode: 200,
            box_number: boxNo,
            data: order,
          });
        }
      });
    } else if (store.searchby_sub == 1) {
      orders.forEach((order) => {
        if (order.items.includes(components[1])) {
          let orderItems = order.items;
          orderItems.forEach((item, i) => {
            if (item == components[1]) {
              boxNo = i + 1;
            }
          });
          flag = true;
          return res.status(200).send({
            status: langObj.success_status_text,
            statusCode: 200,
            box_number: boxNo,
            data: order,
          });
        }
      });
    }
    if (!flag) {
      res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        type: "alert",
        error: {
          heading: langObj.missing_box_heading_text,
          content: langObj.missing_box_content_text,
        },
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
/**
 *   @swagger
 *   components:
 *   schemas:
 *     table_view_options:
 *       type: object
 *       required:
 *         - option
 *       properties:
 *         option:
 *           type: number
 *           description: please enter of option yu have selected
 *         latitude:
 *           type: boolean
 *           description: latitude of user location
 *         longitude:
 *           type: boolean
 *           description: longitude of user location
 *         orderId:
 *           type: string
 *           description: order id of selected order
 *       example:
 *           latitude: 30
 *           longitude: 40
 *           option: 1
 *           orderId: "99574783430"
 */
/**
 * @swagger
 * /delivery/returnorder:
 *   post:
 *     summary: this api is used when driver will take order back due to some reason
 *     tags: [delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/table_view_options'
 *     responses:
 *       200:
 *         description: Returns new token for authorization
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
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.tableViewOptionAfterStartDelivery = async (req, res) => {
  const option = req.body.option;
  const orderId = req.body.orderId;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  let stepType;
  let acceptedStatus = ["SCANNED_IN", "MANUALLY_CONFIRMED"];
  let currentDate = moment(new Date()).format("MM/dd h:mm a");
  let failedStatus;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const order = await Orders.findOne({
      store_id: user.store_id,
      order_id: orderId,
    });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    if (option == 1) {
      order.boxes.forEach((box) => {
        if (acceptedStatus.includes(box.status.type)) {
          box.status.type = "RETURNED";
          box.status.description =
            "Box returned to the store. The driver's reason: No Payment";
          box.status.driver_id = req.user.userId;
        }
      });
      order.visited = 1;
      order.returned = 1;
      order.driver_notes = `${order.driver_notes}  Due to non payment received at ${currentDate} - ${user.first_name} returned order to store`;
      order.save();
      let stepString = `"Driver returning ${order.street_address} ${order.fname} due to no payment`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    } else if (option == 2) {
      order.boxes.forEach((box) => {
        if (acceptedStatus.includes(box.status.type)) {
          box.status.type = "RETURNED";
          box.status.description =
            "Box returned to the store. The driver's reason: Nobody Home";
          box.status.driver_id = req.user.userId;
        }
      });
      order.visited = 1;
      order.returned = 1;
      order.driver_notes = `${order.driver_notes} Nobody was home at ${currentDate} - ${user.first_name} returned order to store`;
      order.save();
      let stepString = `"Driver returning ${order.street_address} ${order.fname} due to nobody home`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    }
    res
      .status(200)
      .send({ status: langObj.success_status_text, statusCode: 200 });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.scanOrderAtCustomerPage = async (req, res) => {
  let barcode_arr = [];
  let components = [],
    splitWith = [];
  let store, failedStatus;
  let rawData = req.body.rawData ?? undefined;
  let orderIds = req.body.orderIds ?? [];
  let flag = false;
  let barcodeMatched = false;
  let cust_orderId = req.body.orderId;
  let acceptedStatus = ["CURRENT_SCANNED_OUT"];
  let confirmedBoxes = 0;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
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
        admin_pass: "admin_pass",
        searchby_sub: "searchby_sub",
      }
    );
    store.searchby_sub = store.searchby_sub ?? 0;

    //converting rawData into string in case front end send it as number
    rawData = rawData.toString();

    //getting barcode format from db
    var barcodeFormats = await BarcodeFormat.find();
    barcodeFormats = JSON.parse(JSON.stringify(barcodeFormats));
    // console.log({barcodeFormats});

    var barcodeFormatBUCH = {};
    //to change position of BUCH format first store BUCH obj in var barcodeFormatBUCH
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUC") {
        barcodeFormatBUCH = barcodeFormat;
      }
    });
    //then remove BUCH record from arr
    barcodeFormats.forEach((barcodeFormat, i) => {
      if (barcodeFormat.barcode_type == "BUC") {
        barcodeFormats.splice(i, i);
      }
    });

    //now push it to the array
    barcodeFormats.push(barcodeFormatBUCH);
    //adding values in splitWith & regex_arr & getting from barcode_format collection
    splitWith = barcodeFormats.map((value) => value.split_with);
    regex_arr = barcodeFormats.map((value) => value.regexformat);
    barcode_arr = barcodeFormats.map((value) => value.barcode_type);
    // for (index = 0; index < regex_arr.length; index++) {
    //   if (rawData.match(regex_arr[index]) !== null) {

    //looping over regex_arr arr and comparing rawData with regex
    for (index = 0; index < barcode_arr.length; index++) {
      if (store.barcode_type == barcode_arr[index]) {
        barcodeMatched = true;
        let regex = new RegExp(regex_arr[index]);
        // if this check pass then use split_with else check for length
        if (regex.test(rawData)) {
          console.log("pass");
          //coomparing regex with barcode
          if (!isNaN(splitWith[index])) {
            buchbarcode = rawData.slice(0, -splitWith[index]);
            components.push(buchbarcode);
            components.push(
              rawData.substring(rawData.length - splitWith[index])
            );
            //checking if barcode which matched with regex has stodeId in format or not if not then add
            if (!barcodeFormats[index].storeid_available) {
              components.unshift(store.store_id);
            }
            if (!barcodeFormats[index].boxno_avaiable) {
              components.push("01");
            }
          } else {
            components = rawData.split(splitWith[index]);
            //checking if barcode which matched with regex has stodeId in format or not if not then add
            if (!barcodeFormats[index].storeid_available) {
              components.unshift(store.store_id);
            }
            if (!barcodeFormats[index].boxno_avaiable) {
              components.push("01");
            }
          }

          break;
        } else {
          buchbarcode = rawData;
          //checking if db provides check_length and if provides, is it greter than rawData length
          if (
            !barcodeFormats[index].check_length ||
            rawData.length > barcodeFormats[index].check_length
          ) {
            if (
              barcodeFormats[index].drop_last &&
              barcodeFormats[index].drop_last[0] &&
              barcodeFormats[index].drop_last[0].true &&
              barcodeFormats[index].drop_last[0].true != 0
            ) {
              //if drop_last[0].true exist not zero then use slice
              buchbarcode = buchbarcode.slice(
                0,
                -barcodeFormats[index].drop_last[0].true
              );
            }
            if (
              barcodeFormats[index].drop_first &&
              barcodeFormats[index].drop_first[0] &&
              barcodeFormats[index].drop_first[0].true &&
              barcodeFormats[index].drop_first[0].true != 0
            ) {
              //if drop_first exist not zero then use slice
              buchbarcode = buchbarcode.slice(
                barcodeFormats[index].drop_first[0].true
              );
              //console.log(buchbarcode);
            }
          }
          //checking if db provides check_length and if provides, is it less than rawData length
          if (
            !barcodeFormats[index].check_length ||
            rawData.length < barcodeFormats[index].check_length
          ) {
            if (
              barcodeFormats[index].drop_last &&
              barcodeFormats[index].drop_last[1] &&
              barcodeFormats[index].drop_last[1].false &&
              barcodeFormats[index].drop_last[1].false != 0
            ) {
              buchbarcode = buchbarcode.slice(
                0,
                -barcodeFormats[index].drop_last[1].false
              );
            }
            if (
              barcodeFormats[index].drop_first &&
              barcodeFormats[index].drop_first[1] &&
              barcodeFormats[index].drop_first[1].false &&
              barcodeFormats[index].drop_first[1].false != 0
            ) {
              buchbarcode = buchbarcode.slice(
                barcodeFormats[index].drop_first[1].false
              );
            }
          }
          // console.log(buchbarcode);
          if (!barcodeFormats[index].storeid_available) {
            components.unshift(store.store_id);
          }
          components.push(buchbarcode);
          if (!barcodeFormats[index].boxno_avaiable) {
            components.push("01");
          }
          break;
        }
      }
    }
    //checking box scanned
    if (rawData.length < store.barcode_minimum) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        type: "grid",
        title: langObj.invalid_barcode_heading_text,
        error: langObj.invalid_barcode_length_text,
      });
    } else if (store.barcode_type == "RDT" && rawData.includes("/") == false) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        type: "grid",
        title: langObj.invalid_barcode_heading_text,
        error: langObj.invalid_barcode_text,
      });
    } else {
      if (components.length != 3) {
        return res.status(406).send({
          status: langObj.failed_status_text,
          statusCode: 406,
          type: "grid",
          title: langObj.invalid_barcode_heading_text,
          error: langObj.uncomplete_barcode_text,
        });
      } else if (user.store_id != components[0]) {
        langObj.invalid_storeId_in_barcode_text =
          langObj.invalid_storeId_in_barcode_text.replace(
            "$barcodeData",
            rawData
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 402,
          type: "grid",
          title: langObj.warning_text,
          error: langObj.invalid_storeId_in_barcode_text,
        });
      } else if (components[2] == null) {
        langObj.missing_boxno_in_barcode_text =
          langObj.missing_boxno_in_barcode_text.replace(
            "$barcodeData",
            rawData
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 404,
          type: "grid",
          title: langObj.warning_text,
          error: langObj.missing_boxno_in_barcode_text,
        });
      }
    }
    let storeId = components[0];
    let orderId = components[1];
    boxNo = components[2];
    const orders = await Orders.find({
      order_id: { $in: orderIds },
      store_id: user.store_id,
    });
    if (!orders) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    //searchby_sub is 1 then orderid and box number will be recalculated acc to following
    if (store.searchby_sub == 1) {
      orders.forEach((order) => {
        if (order.items.includes(components[1])) {
          orderId = order.order_id;
          let orderItems = order.items;
          orderItems.forEach((item, i) => {
            if (item == components[1]) {
              boxNo = i + 1;
            }
          });
        }
      });
    }
    let order = await Orders.findOne({ order_id: orderId, store_id: storeId });
    let custOrder = await Orders.findOne({ order_id: cust_orderId, store_id });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    if (!custOrder) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    //checking if cust orderid matches with scanned order box if not then check if
    //scanned orderid matches with all orders
    if (orderId != cust_orderId) {
      //comapring with cust id
      //comparing with all orders

      orders.forEach((order) => {
        if (order.order_id == orderId) {
          flag = true;
        }
      });
      if (flag) {
        langObj.another_customer_order_content_text =
          langObj.another_customer_order_content_text.replace(
            "$orderName",
            order.fname
          );
        langObj.another_customer_order_content_text =
          langObj.another_customer_order_content_text.replace(
            "$streetAddress",
            order.street_address
          );
        langObj.another_customer_order_content_text =
          langObj.another_customer_order_content_text.replace(
            "$custOrderName",
            custOrder.fname
          );
        langObj.another_customer_order_content_text =
          langObj.another_customer_order_content_text.replace(
            "$custOrderStreetAddress",
            custOrder.street_address
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 404,
          responseObj: {
            heading: langObj.another_customer_order_heading_text,
            content: langObj.another_customer_order_content_text,
          },
        });
      } else {
        langObj.another_customer_order_content_2_text =
          langObj.another_customer_order_content_2_text.replace(
            "$orderName",
            custOrder.fname
          );
        langObj.another_customer_order_content_2_text =
          langObj.another_customer_order_content_2_text.replace(
            "$streetAddress",
            custOrder.street_address
          );
        return res.status(404).send({
          status: langObj.failed_status_text,
          statusCode: 404,
          responseObj: {
            heading: langObj.another_customer_order_heading_text,
            content: langObj.another_customer_order_content_2_text,
          },
        });
      }
    }
    //in old app they are updating scanned box status without condition
    custOrder.boxes.forEach((box) => {
      if (box.number == boxNo) {
        box.status.type = "CURRENT_SCANNED_OUT";
        box.status.description =
          "Box is already scanned out and delivered to the customer.";
        box.status.driver_id = req.user.userId;
      }
    });
    //fetching confirmedBoxes count
    custOrder.boxes.forEach((box) => {
      if (acceptedStatus.includes(box.status.type)) {
        confirmedBoxes++;
      }
    });
    custOrder.visited = 1;
    custOrder.returned = 0;
    let leftBoxes = custOrder.total_boxes - confirmedBoxes;
    if (leftBoxes <= 0) {
      res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        responseObj: { heading: langObj.all_boxes_scanned_text },
      });
    } else {
      langObj.boxes_scanned_text = langObj.boxes_scanned_text.replace(
        "$boxesLeft",
        leftBoxes
      );
      langObj.boxes_scanned_text = langObj.boxes_scanned_text.replace(
        "$scannedBoxes",
        confirmedBoxes
      );
      res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        responseObj: { heading: langObj.boxes_scanned_text },
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.customerPage = async (req, res) => {
  let boxNo = req.body.boxNumber;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  let orderId = req.body.orderId;
  let failedStatus;
  let stepType;
  let currentDate = moment(new Date()).format("h:mm a");
  let currentConfirmedBoxes = 0;
  let currentConfirmedAcceptedStatus = [
    "CURRENT_SCANNED_OUT",
    "CURRENT_MANUALLY_SCANNED_OUT",
    "CURRENT_MANUALLY_DELIVERED",
    "CURRENT_NOT_SCANNED_OUT",
    "CURRENT_NOT_DELIVERED",
    "SCANNED_OUT",
    "MANUALLY_SCANNED_OUT",
    "MANUALLY_DELIVERED",
  ];
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    let order = await Orders.findOne({
      store_id: user.store_id,
      order_id: orderId,
    });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    user.is_delivering = "1";
    user.latest_action = `Delivering to ${order.fname} ${order.street_address} at ${currentDate}`;
    user.last_location = [latitude, longitude];
    user.save();
    if (boxNo != 0) {
      stepString = `Scanned Box Number: ${
        boxNo ?? 0
      } to start dropoff procedure for ${order.fname ?? ""} ${
        order.street_address
      }`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    } else {
      stepString = `Swiped to start dropoff procedure for ${
        order.fname ?? ""
      } ${order.street_address}`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    }
    if (order.boxes[boxNo]) {
      order.boxes[boxNo].status.type = "CURRENT_SCANNED_OUT";
      order.boxes[boxNo].status.description =
        "Box is already scanned out and delivered to the customer.";
      order.boxes[boxNo].status.driver_id = req.user.userId;
      order.save();
    }
    order.boxes.forEach((box) => {
      if (currentConfirmedAcceptedStatus.includes(box.status.type)) {
        currentConfirmedBoxes++;
      }
    });
    leftCalculation = (order.total_boxes ?? 1) - (currentConfirmedBoxes ?? 0);
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.cancelOrdeAtCustomerPage = async (req, res) => {
  const option = req.body.option;
  const orderId = req.body.orderId;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  let stepType;
  let failedStatus;
  let currentDate = moment(new Date()).format("MM/dd h:mm a");
  let acceptedStatus = [
    "SCANNED_IN",
    "MANUALLY_CONFIRMED",
    "CURRENT_SCANNED_OUT",
    "CURRENT_MANUALLY_SCANNED_OUT",
    "CURRENT_MANUALLY_DELIVERED",
    "CURRENT_NOT_SCANNED_OUT",
    "CURRENT_NOT_DELIVERED",
  ];
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const order = await Orders.findOne({
      store_id: user.store_id,
      order_id: orderId,
    });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    if (option == 1) {
      order.boxes.forEach((box) => {
        if (acceptedStatus.includes(box.status.type)) {
          box.status.type = "RETURNED";
          box.status.description =
            "Box is returned to the store. The driver's reason: Nobody Home";
          box.status.driver_id = req.user.userId;
        }
      });
      order.visited = 1;
      order.returned = 1;
      order.eta = new Date();
      order.driver_notes = `Nobody home at ${currentDate} - returning order to store`;
      order.save();
      let stepString = `returning ${order.fname} ${order.street_address}  order to store because nobody was home to receive delivery`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    } else if (option == 2) {
      order.boxes.forEach((box) => {
        if (acceptedStatus.includes(box.status.type)) {
          box.status.type = "RETURNED";
          box.status.description =
            "Box is returned to the store. The driver's reason: No Payment";
          box.status.driver_id = req.user.userId;
        }
      });
      order.visited = 1;
      order.returned = 1;
      order.eta = new Date();
      order.driver_notes = `Due to no payment received at ${currentDate} - returning order to store`;
      order.save();
      let stepString = `returning ${order.fname} ${order.street_address}  order to store because of non-payment of COD`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    } else if (option == 3) {
      order.boxes.forEach((box) => {
        if (acceptedStatus.includes(box.status.type)) {
          box.status.type = "NOT_DELIVERED";
          box.status.description = "Driver saved order for future delivery.";
          box.status.driver_id = req.user.userId;
        }
      });
      order.visited = 1;
      order.returned = 1;
      order.eta = new Date();
      order.driver_notes = `Driver marked this order as "Deliver Later" at ${currentDate}`;
      order.save();
      let stepString = `Driver marked this order as "Deliver Later" at ${currentDate}`;
      driverSteps(stepType, stepString, user, longitude, latitude);
    }
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      message: "order has been cancelled",
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.finishDelivery = async (req, res) => {
  const orderId = req.body.orderId;
  let failedStatus;
  const driverNotes = req.body.notes;
  const isFar = req.body.isFar;
  let uploadedPicture = req.body.uploadedPicture;
  let collectingPayment = req.body.collectingPayment;
  let paidCash = req.body.paidCash;
  let paidCheck = req.body.paidCheck;
  let longitude = req.body.longitude;
  let latitude = req.body.latitude;
  let scannedAcceptedStatus = ["CURRENT_SCANNED_OUT"];
  let manualScannedAcceptedStatus = ["CURRENT_MANUALLY_SCANNED_OUT"];
  let manualAcceptedStatus = ["CURRENT_MANUALLY_DELIVERED"];
  let notScannedOutAcceptedStatus = ["CURRENT_NOT_SCANNED_OUT"];
  let notDeliveredAcceptedStatus = ["CURRENT_NOT_DELIVERED"];
  let manual_still_confimred_status = ["MANUALLY_CONFIRMED"];
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const order = await Orders.findOne({
      store_id: user.store_id,
      order_id: orderId,
    });
    if (!order) {
      return res.status(404).send({
        status: langObj.failed_status_text,
        statusCode: 404,
        error: langObj.invalid_order_id_text,
      });
    }
    order.eta = new Date();
    order.returned = 0;
    order.visited = 1;
    if (driverNotes.length != 0) {
      order.driver_notes = `${user.first_name} wrote:  ${notes}`;
    }
    if (isFar) {
      order.far_from_dest = isFar;
    }
    if (uploadedPicture) {
      order.uploaded_pic = uploadedPicture;
    }
    if (collectingPayment != 0) {
      order.collecting_payment = collectingPayment;
    }
    if (paidCash == 1 && paidCheck != 1) {
      order.payment_details = `Cash: ${cash}`;
    } else if (paidCheck == 1 && paidCash != 1) {
      order.payment_details = `Check #:${checkNumber}. Amount: $${totalAmount}`;
    } else {
      order.payment_details = `Cash: $${cash}
      Check #:${checkNumber}. Amount: ${totalAmount}`;
    }
    if (user.is_scanning) {
      order.boxes_scanned_out = order.total_boxes;
      order.boxes_scanned_out = `${
        order.total_boxes ?? 0
      },${latitude},${longitude},123.56,1`;
    } else {
      order.boxes_scanned_out = `${
        order.total_boxes ?? 0
      },${latitude},${longitude},123.57,1`;
    }

    order.boxes.forEach((box) => {
      if (scannedAcceptedStatus.includes(box.status.type)) {
        box.status.type = "SCANNED_OUT";
        box.status.description =
          "Box is already scanned out and delivered to the customer.";
        box.status.driver_id = req.user.userId;
      } else if (manualScannedAcceptedStatus.includes(box.status.type)) {
        box.status.type = "MANUALLY_SCANNED_OUT";
      } else if (manualAcceptedStatus.includes(box.status.type)) {
        box.status.type = "MANUALLY_DELIVERED";
      } else if (manual_still_confimred_status.includes(box.status.type)) {
        box.status.type = "MANUALLY_DELIVERED";
        box.status.description = "Box delivered with no confirmation needed.";
      } else if (notScannedOutAcceptedStatus.includes(box.status.type)) {
        box.status.type = "MANUALLY_DELIVERED";
      } else if (notDeliveredAcceptedStatus.includes(box.status.type)) {
        box.status.type = "NOT_DELIVERED";
      }
    });
    res
      .status(200)
      .send({
        status: langObj.success_status_text,
        statusCode: 200,
        data: order,
      });
    order.save();
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
exports.sendSmsOnStartDeliveryToManager = async (req, res) => {
  let mapRoute = req.body.mapRoute ?? false;
  let unVisitedOrdersExist = req.body.unVisitedOrders ?? false;
  let originalRouteStarted = req.body.originalRouteStarted;
  let failedStatus;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    let store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        sms_on_route_start: "sms_on_route_start",
      }
    );
    store.sms_on_route_start = store.sms_on_route_start ?? 1;
    if (mapRoute && unVisitedOrdersExist && store.sms_on_route_start) {
      var config = {
        method: "get",
        url: `https://barcoder-cyf.herokuapp.com/public/nexmo_sms_route_start?store_id=${user.store_id}&route_started=${originalRouteStarted}`,
      };
      axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          res.status(200).send({
            status: langObj.success_status_text,
            statusCode: 200,
            message: "done",
          });
        })
        .catch(function (error) {
          console.log(error);
          res.status(500).send({
            status: langObj.failed_status_text,
            statusCode: 500,
            error: error,
          });
        });
    }
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.notifyManagerUserReturn = async (req, res) => {
  let originalRouteStarted = req.body.originalRouteStarted;
  let etaForStore = req.body.etaForStore;
  let justDeliveredAddress = req.body.justDeliveredAddress;
  let failedStatus;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    let store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        sms_on_route_start: "sms_on_route_start",
        manager_phone: "manager_phone",
        manager_phone2: "manager_phone2",
        store_id: "store_id",
      }
    );
    store.sms_on_route_start = store.sms_on_route_start ?? 1;
    store.manager_phone = store.manager_phone ?? "";
    store.manager_phone2 = store.manager_phone2 ?? "0";
    var config = {
      method: "get",
      url: `https://barcoder-cyf.herokuapp.com/public/nexmo_driver_return?eta_back=${etaForStore}&driver_name=${user.first_name}&manager_phone=${store.manager_phone}&last_stop=${justDeliveredAddress}&route_started=${originalRouteStarted}&store_id=${store.store_id}`,
    };
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        console.log("pass");
      })
      .catch(function (error) {
        console.log("failed1");

        console.log(error);
        return res.status(500).send({
          status: langObj.failed_status_text,
          statusCode: 500,
          error: error,
        });
      });
    console.log("reached");
    setTimeout(() => {
      if (store.manager_phone2 == "0") {
        console.log("reached2");
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: "done1",
        });
      } else {
        var config = {
          method: "get",
          url: `https://barcoder-cyf.herokuapp.com/public/nexmo_driver_return?eta_back=${etaForStore}&driver_name=${user.first_name}&manager_phone=${store.manager_phone2}&last_stop=${justDeliveredAddress}&route_started=${originalRouteStarted}&store_id=${store.store_id}`,
        };
        axios(config)
          .then(function (response) {
            console.log(JSON.stringify(response.data));
            console.log("pass2");
            res.status(200).send({
              status: langObj.success_status_text,
              statusCode: 200,
              message: "done",
            });
          })
          .catch(function (error) {
            console.log("failed2");
            console.log(error);
            res.status(500).send({
              status: langObj.failed_status_text,
              statusCode: 500,
              error: error,
            });
          });
      }
    }, 2000);
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.notifyDriverDoodleTime = async (req, res) => {
  let failedStatus;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    let store = await findData(
      Store,
      { store_id: user.store_id },
      {
        show_yesterdays_orders_too: "show_yesterdays_orders_too",
        store_name: "store_name",
        sms_on_route_start: "sms_on_route_start",
        manager_phone: "manager_phone",
        manager_phone2: "manager_phone2",
        store_id: "store_id",
        nexmo_num: "nexmo_num",
      }
    );
    store.sms_on_route_start = store.sms_on_route_start ?? 1;
    store.manager_phone = store.manager_phone ?? "";
    store.nexmo_num = store.nexmo_num ?? " ";
    store.manager_phone2 = store.manager_phone2 ?? "0";
    var config = {
      method: "get",
      url: `https://barcoder-cyf.herokuapp.com/public/nexmo_driver_doodle?from=${store.nexmo_num}&driver_name=${user.first_name}&manager_phone=${store.manager_phone}`,
    };
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        console.log("pass");
      })
      .catch(function (error) {
        console.log("failed1");

        console.log(error);
        return res.status(500).send({
          status: langObj.failed_status_text,
          statusCode: 500,
          error: error,
        });
      });
    console.log("reached");
    setTimeout(() => {
      if (store.manager_phone2 == "0") {
        console.log("reached2");
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          message: "done1",
        });
      } else {
        var config = {
          method: "get",
          url: `https://barcoder-cyf.herokuapp.com/public/nexmo_driver_doodle?from=${store.nexmo_num}&driver_name=${user.first_name}&manager_phone=${store.manager_phone2}`,
        };
        axios(config)
          .then(function (response) {
            console.log(JSON.stringify(response.data));
            console.log("pass2");
            res.status(200).send({
              status: langObj.success_status_text,
              statusCode: 200,
              message: "done",
            });
          })
          .catch(function (error) {
            console.log("failed2");
            console.log(error);
            res.status(500).send({
              status: langObj.failed_status_text,
              statusCode: 500,
              error: error,
            });
          });
      }
    }, 2000);
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
// exports.startDelivery = async (req, res) => {
//   let {
//     startLatitude,
//     startLongitude,
//     endLatitude,
//     endLongitude,
//     step_string,
//   } = req.body;
//   let userId = req.user.userId;
//   let today = new Date();
//   let currentDateAndTime = today.toISOString();
//   let msg;
//   let success_status,failed_status
//   try {
//     // fetching user
//     const user = await User.findOne({ _id: userId });

//     if (!user.end_lat || !user.end_lon) {
//       //if end latitude and longitude is not defined means delivery is just begins and update them
//       const user_update = await User.findOneAndUpdate(
//         { _id: userId },
//         {
//           $set: {
//             start_lat: startLatitude,
//             start_lon: startLongitude,
//             end_lat: endLatitude,
//             end_lon: endLongitude,
//             last_location: [startLongitude, startLatitude],
//             original_route_started:
//               currentDateAndTime.slice(0, 10) +
//               "-" +
//               currentDateAndTime.slice(12, 20),
//             started_driving:
//               currentDateAndTime.slice(0, 10) +
//               "-" +
//               currentDateAndTime.slice(12, 20),
//           },
//         }
//       );
//        // checking for user language
//        if(user.Language ==1) {
//         success_status =  process.env.SUCCESS_STATUS_ENGLISH
//         failed_status = process.env.FAILED_STATUS_ENGLISH
//         msg = process.env.NEW_DELIVERY_MSG_ENGLISH
//       } else if(user.Language ==2){
//         success_status =  process.env.SUCCESS_STATUS_SPANISH
//         failed_status = process.env.FAILED_STATUS_SPANISH
//         msg = process.env.NEW_DELIVERY_MSG_SPANISH
//       } else {
//         success_status =  process.env.SUCCESS_STATUS_ENGLISH
//         failed_status = process.env.FAILED_STATUS_ENGLISH
//         msg = process.env.NEW_DELIVERY_MSG_ENGLISH
//       }
// //status code
//       statusCode=201
//     } else {
//       const user_update = await User.findOneAndUpdate(
//         { _id: userId },
//         {
//           $set: {
//             last_location: [startLongitude, startLatitude],
//             latest_action: step_string,
//           },
//         }
//       );
//       if(user.Language ==1) {
//         success_status =  process.env.SUCCESS_STATUS_ENGLISH
//         failed_status = process.env.FAILED_STATUS_ENGLISH
//         msg = process.env.UPDATE_DELIVERY_MSG_ENGLISH
//       } else if(user.Language ==2){
//         success_status =  process.env.SUCCESS_STATUS_SPANISH
//         failed_status = process.env.FAILED_STATUS_SPANISH
//         msg = process.env.UPDATE_DELIVERY_MSG_SPANISH
//       } else {
//         success_status =  process.env.SUCCESS_STATUS_ENGLISH
//         failed_status = process.env.FAILED_STATUS_ENGLISH
//         msg = process.env.UPDATE_DELIVERY_MSG_ENGLISH
//       }
//       //status code
//       statusCode=200
//     }
//     // creating first driver Step document
//     // const driverSteps = new DriverSteps({
//     //   step_date: new Date(),
//     //   route_started: user.original_route_started,
//     //   step_geopoint: [startLongitude, startLatitude],
//     //   user_id: req.user.userId,
//     //   step_string: step_string,
//     //   step_type: 1,
//     //   _created_at: new Date(),
//     //   _updated_at: new Date(),
//     // });
//     // driverSteps.save();
//     res.status(201).send({
//       staus: success_status,
//       statusCode,
//       message: msg,
//     });
//   } catch (err) {
//     res.status(400).send({ status:failed_status,statusCode:400, error: err });
//   }
// };

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
