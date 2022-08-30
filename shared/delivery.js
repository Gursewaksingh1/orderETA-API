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
    
    order.save()
  });
  return orders;
};

const check_similar_address = async (
  orders,
  similar_adress,
  similar_street,
  Model,
  storeId,
  langObj
) => {
  let addressDetails;
  let addressArray = [];
//creating address array acc to condition
  orders.forEach((order) => {
    if (similar_street == 1) {
      streetAddress = order.street_address.replace(/\d+/g, "");
      addressArray.push(streetAddress);
    } else if (similar_adress == 1) {
      addressArray.push(order.street_address);
    }
  });
  console.log(addressArray);
  //extracting object ids of all orders
  let objectIds = orders.map((order) => order._id);
//fetching un assigned orders except order which user already have 
  let similarOrders = await Model.find(
    ({
      store_id: storeId,
      datetime_created: {
        $gte: moment().subtract(1, "days").format(process.env.YYYYMMDD),
      },
      deleted_from_device: { $ne: 1 },
      hidden: { $ne: 1 },
      visited: { $ne: 1 },
      route_started: { $eq: null },
      _id: { $nin: objectIds },
    })
  );
  console.log(similarOrders);
  //if sirmialr address matches with any order address of simialrOrders then send response
  for(order of similarOrders) {
    if (addressArray.includes(order.street_address)) {
      langObj.similar_order_found_content_text =  langObj.similar_order_found_content_text.replace("$orderName",order.fname," "+order.lname)
      langObj.similar_order_found_content_text =  langObj.similar_order_found_content_text.replace("$streetAddress",order.street_address)
      langObj.similar_order_found_content_text =  langObj.similar_order_found_content_text.replace("$totalBoxes",order.boxes.length)
     
      addressDetails = {
      heading: langObj.similar_order_found_heading_text,
      content: langObj.content_similar_order_text,
      option1: langObj.similar_order_found_option_1_text,
      option2: langObj.similar_order_found_option_2_text,
    };
    break
  }
  }
  return addressDetails || false;
};

const admin_override_order = (orders,userPass,storePass,confirmedStatus,userId) => {
  console.log(userPass,storePass);
    if(userPass == storePass) {

      orders.forEach((order) => {
        order.boxes.forEach((box) => {
          if (!confirmedStatus.includes(box.status.type)) {
            box.status.type = "MANUALLY_CONFIRMED";
            box.status.description = "Box manually confirmed.";
            box.status.driver_id = userId;
          }
        });
        order.save();
      });
      return orders;
    } else {
      return false;
    }
}

module.exports = {
  start_delivery_manually_confirm,
  check_similar_address,admin_override_order
};
