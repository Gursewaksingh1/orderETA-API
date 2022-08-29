const User = require("../model/user");
// const DriverSteps = require("../model/driversteps");
const Orders = require("../model/orders");
const Store = require("../model/store");
const Language = require("../model/language");
const moment = require("moment");
const lodash = require("lodash");
const {
  start_delivery_manually_confirm,
  check_similar_address,
  admin_override_order,
} = require("../shared/delivery");
let { uniqueorders, unvisitedorders } = require("../shared/orders");

/**
 *   @swagger
 *   components:
 *   schemas:
 *     start_delivery:
 *       type: object
 *       required:
 *         - orderIds
 *       properties:
 *         refreshToken:
 *           type: Array
 *           description: array of order ids
 *       example:
 *           orderIds: ["99574783430","9957478343990"]
 */
/**
 * @swagger
 * /delivery:
 *   post:
 *     summary: when token gets expired use this endpoint to get new token
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
    store.admin_pass = store.admin_pass ?? "";
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
    langObj.additional_orders_heading_text.replace("$number", uniqueResult.length);
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
        heading: langObj.box_not_scanned_heading + missingBoxes_text,
        missingBoxes: missingBoxes,
        content: langObj.box_not_scanned_content_text,
        Option1: langObj.box_not_scanned_option_1_text,
        option3: langObj.box_not_scanned_option_3_text,
      };
      if (user.Language == 1) {
        responseObj.subHeading2 = "Manager override";
      }
      return res
        .status(400)
        .send({ status: failedStatus, statusCode: 400, responseObj });
    }
    //allow_manully_confirm is a flag and it would be true when user select option i can't scan boxes
    if (allow_manully_confirm) {
      if (user.is_segueing == 1) {
        return res.status(400).send({
          status: failedStatus,
          statusCode: 400,
          message: missingBoxes,
        });
      } else {
        //this else block will work when user selected option "i can't scan orders"
        allOrders = start_delivery_manually_confirm(
          allOrders,
          confirmedStatus,
          req.user.userId
        );
      }
    }
    if (admin_override && user.Language == 1 && !password) {
      return res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        message: {
          heading:
            "Admin can let you avoid marking each box this by typing password:",
          content: "Enter manager password:",
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
            title: "WRONG PASSWORD!!",
            heading:
              "Admin can let you avoid marking each box this by typing password:",
            content: "Enter manager password:",
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
        return res.status(200).send({
          status: langObj.success_status_text,
          statusCode: 200,
          type: "alert",
          message: result,
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
    user.res.status(200).send({
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
      order_id: { $in: orderIds },
      visited: { $ne: 1 },
    }).countDocuments();

    const orders = await Orders.find({ order_id: { $in: orderIds } });

    let presortedOrder = orders.map((order) => {
      return order.presorted == 1;
    });
    orders.forEach((order, index) => {
      order.user_id = req.user.user_id;
      order.driver_string = user.driver_string;

      if (orderNo == 0) {
        let original_route_started = moment(new Date()).format(
          "yyyy-MM-dd-HH:mm:ss"
        );
        order.route_started = original_route_started;
        if (presortedOrder.length !== 0) {
          order.sequence = index + 1;
        }
        if (
          order.boxes_scanned_in != order.total_boxes &&
          user.orders_entry_method == 1
        ) {
          order.has_problem = 1;
        }
      }
      order.save();
    });
    res
      .status(200)
      .send({
        status: langObj.success_status_text,
        statusCode: 200,
        data: orders,
      });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

exports.driverSteps = async (req, res) => {
  const userId = req.user.userId;
  let failedStatus;
  try {
    const user = await User.findOne({ _id: userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    const driverSteps = new DriverSteps({
      step_date: new Date(),
      route_started: req.body.original_route_started ?? "",
      step_geopoint: [startLongitude, startLatitude],
      user_id: req.user.userId,
      step_string: req.body.step_string,
      step_type: req.body.stepType,
      _created_at: new Date(),
      _updated_at: new Date(),
    });
    driverSteps.save();
    res.status(201).send({
      staus: langObj.success_status_text,
      statusCode: 201,
      message: "driver step has been recorded",
    });
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
exports.updateUser = async (req, res) => {
  const userId = req.user.userId;
  const longitude = req.body.longitude;
  const latitude = req.body.latitude;
  const isDelivering = req.body.isDelivering;
  const total_addresses_in_run = req.body.total_addresses_in_run;
  const first_time = req.body.first_time;
  const original_route_started = req.body.original_route_started;
  const etaDateForParse = req.body.etaDateForParse;
  const addresses_yet_to_visit = req.body.addresses_yet_to_visit;
  const orderId = req.body.orderId;
  let timeStamp = moment(new Date()).format("h:mm:ss a");
  try {
    const order = await findOne({ order_id: orderId });
    const user = await User.findOne({ _id: userId });
    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status_text;
    user.last_location = [longitude, latitude];
    user.is_delivering = isDelivering;
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
      user.next_stop = "When left his last stop ETA to store was";
    }
    user.save();
    res.status(200).send({
      status: langObj.success_status_text,
      statusCode: 200,
      message: "user updated successfully",
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
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
