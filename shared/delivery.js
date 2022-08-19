const moment = require("moment");

const start_delivery_manually_confirm = (orders, confirmedStatus, userId) => {
  orders.forEach((order) => {
    order.boxes.forEach((box) => {
      if (!confirmedStatus.includes(box.status.type)) {
        box.status.type = "MANUALLY_CONFIRMED";
        box.status.description = "Box manually confirmed.";
        box.status.driver_id = userId;
      }
    });
  });
  return orders;
};

const check_similar_address = async (
  orders,
  similar_adress,
  similar_street,
  Model,
  language
) => {
  let addressArray = [];
  content_similar_order =
    language == 1
      ? process.env.CONTENT_SIMILAR_ORDER_ENGLISH
      : process.env.CONTENT_SIMILAR_ORDER_SPANISH;
  cancel_word =
    language == 1
      ? process.env.CANCEL_WORD_SIMILAR_ORDER_ENGLISH
      : process.env.CANCEL_WORD_SIMILAR_ORDER_SPANISH;
  confirm_word =
    language == 1
      ? process.env.CONFIRM_WORD_SIMILAR_ORDER_ENGLISH
      : process.env.CONFIRM_WORD_SIMILAR_ORDER_SPANISH;
  similar_order =
    language == 1
      ? process.env.SIMILAR_ORDER_ENGLISH
      : process.env.SIMILAR_ORDER_SPANISH;
//creating address array acc to condition
  orders.forEach((order) => {
    if (similar_street == 1) {
      streetAddress = order.street_address.replace(/\d+/g, "");
      addressArray.push(streetAddress);
    } else if (similar_adress == 1) {
      addressArray.push(order.street_address);
    }
  });
  //extracting object ids of all orders
  let objectIds = orders.map((order) => order._id);
//fetching un assigned orders except order which user already have 
  let similarOrders = await Model.find(
    ({
      store_id: store.store_id,
      datetime_created: {
        $gte: moment().subtract(1, "days").format(process.env.YYYYMMDD),
      },
      deleted_from_device: { $ne: 1 },
      hidden: { $ne: 1 },
      visited: { $ne: 1 },
      route_started: { $eq: null },
      objectId: { $nin: objectIds },
    })
  );
  //if sirmialr address matches with any order address of simialrOrders then send response
  similarOrders.forEach((order) => {
    if (addressArray.includes(order.street_address)) {

        content_similar_order = content_similar_order.replace("ORDERNAME",order.fname," "+lname)
        content_similar_order = content_similar_order.replace("ADDRESS",order.street_address)
        content_similar_order = content_similar_order.replace("TOTALBOXES",order.boxes.length)
        return {
        heading: similar_order,
        content: content_similar_order,
        confirm_wording: confirm_word,
        cancel_wording: cancel_word,
      };
    }
  });
  return false;
};

const admin_override_order = () => {
    
}
module.exports = {
  start_delivery_manually_confirm,
  check_similar_address,
};
