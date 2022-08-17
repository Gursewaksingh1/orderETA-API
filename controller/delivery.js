const User = require("../model/user");
const DriverSteps = require("../model/driversteps");
const Orders = require("../model/orders");
const Store = require("../model/store");
const moment = require("moment");
const lodash = require("lodash");

exports.startDelivery = async (req, res) => {
  let userId = req.user.userId;
  let orderIds = req.body.orderIds;
  let query,check = false;
  let allow_manully_confirm = req.body.manullyConfirm ?? true
    
  let missingBoxes = "";
  notConfirmedBoxes = false;
  let new_orders, success_status, failed_status, info_changed;
  let box_not_scanned1, box_not_scanned2;
  let acceptedStatus = ["IN_STORE", "RETURNED", "MANUALLY_DELETED"];
  let confirmedStatus = ["SCANNED_IN", "MANUALLY_CONFIRMED", "SCANNED_OUT", "MANUALLY_SCANNED_OUT", "MANUALLY_DELIVERED"]
  let date_sent_to_device_check = moment(new Date()).format(
    process.env.YYYYMMDD
  );
  let datetime_created_check = moment(new Date())
    .add(1, "days")
    .format(process.env.YYYYMMDD);
  try {
    const user = await User.findOne({ _id: userId });
user.is_segueing = user.is_segueing ?? 0
    success_status =
      user.Language == 1
        ? process.env.SUCCESS_STATUS_ENGLISH
        : process.env.SUCCESS_STATUS_SPANISH;
    failed_status =
      user.Language == 1
        ? process.env.FAILED_STATUS_ENGLISH
        : process.env.FAILED_STATUS_SPANISH;
    new_orders =
      user.Language == 1
        ? process.env.NEW_ORDERS_ENGLISH
        : process.env.NEW_ORDERS_SPANISH;
    info_changed =
      user.Language == 1
        ? process.env.INFO_CHANGED_ENGLISH
        : process.env.INFO_CHANGED_SPANISH;
    box_not_scanned1 =
      user.Language == 1
        ? process.env.BOX_NOT_SCANNED1_ENGLISH
        : process.env.BOX_NOT_SCANNED1_SPANISH;
    box_not_scanned2 =
      user.Language == 1
        ? process.env.BOX_NOT_SCANNED2_ENGLISH
        : process.env.BOX_NOT_SCANNED2_SPANISH;
    BOX_NOT_SCANNED2_SPANISH;
    //if load_in_late_orders_too is undefined then set zero

    user.load_in_late_orders_too = user.load_in_late_orders_too ?? 0;
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
      }
    );
    store.disallow_missing_boxes =  store.disallow_missing_boxes ?? 0
    store.days_in_past_to_import = store.days_in_past_to_import ?? 1;
    store.confirm_orders_no_swipe = store.confirm_orders_no_swipe ?? 0;
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
    //checking if admin changed any order details
    allOrders.forEach((orderObj1) => {
      orders.forEach((orderObj2) => {
        if (orderObj1 == orderObj2) {
          lodash.isEqual(orderObj1, orderObj2);
          check = true;
        }
      });
    });
    newArr = lodash.uniq(allOrders, orders, "order_id");
    //if new orders are available then send all order and msg
    if (uniqueResult.length !== 0) {
      return res
        .status(200)
        .send({
          status: success_status,
          statusCode: 200,
          data: newArr,
          message: new_orders,
        });
    } else if (check) {
      return res
        .status(200)
        .send({
          status: success_status,
          statusCode: 200,
          data: newArr,
          message: info_changed,
        });
    }

    //step 2

    if (confirm_orders_no_swipe != 1) {
      allOrders.forEach((order) => {
        order.boxes.forEach((box) => {
          //if current box of order contains status which is present in acceptedStatus then show alert
          if (acceptedStatus.includes(box.status.type)) {
            missingBoxes += ` Box # ${box.status.number}, ${order.name} ${order.streetAddress} order #:  ${order.order_id}\n`;
            notConfirmedBoxes = true;
          }
        });
      });
    }
      //here we check if anyone box had acceptedStatus
      if (notConfirmedBoxes) {
        //if store allows user to manully confirm order at the time of start delivery 
        if(store.disallow_missing_boxes != 1) {
          return res
          .status(400)
          .send({
            status: failed_status,
            statusCode: 400,
            Heading: box_not_scanned1 + missingBoxes + box_not_scanned2,
            subHeading1: "i can't scan these boxes",
            subHeading2:"Manager override",
            subHeading3: "Cancel, I will look for them"
          });
        
        } else {
          return res
          .status(400)
          .send({
            status: failed_status,
            statusCode: 400,
            Heading: box_not_scanned1 + missingBoxes + box_not_scanned2,
            subHeading2:"Manager override",
            subHeading3: "Cancel, I will look for them"
          });
        } 
      }
      if(allow_manully_confirm) {
        if(user.is_segueing== 1) {
          return res
          .status(400)
          .send({
            status: failed_status,
            statusCode: 400,
            message: missingBoxes
          });
        } else {
        allOrders = start_delivery_manually_confirm(allOrders,confirmedStatus,req.user.userId)
        }
      }

  } catch (err) {
    console.log(err);
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
