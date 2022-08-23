const moment = require("moment");

const lodash = require("lodash");
function confirm_orders(orders,acceptedStatus) {
    let acceptedStatus = ["IN_STORE", "RETURNED", "NOT_CONFIRMED", "NOT_SCANNED_OUT", "NOT_DELIVERED", "MANUALLY_DELETED"]
    orders.forEach(order => {
       
        order.boxes.forEach(box => {
            if(acceptedStatus.includes(box.status.type) && order.visited != 1 && order.returned != 1) {
                box.status.type = "MANUALLY_CONFIRMED";
                box.status.description = "Order has been automatically confirmed when driver pressed the cloud button.";
                box.status.driver_id = userId;

            }
        })
    })
}

function unVisitedOrders(orders) {
    let Orders = []
    orders.forEach(order => {
        if(order.visited !== 1) {
            Orders.push(order)
        }
    })
    return Orders
}

function uniqueOrders(orders) {
    let uniqueByLat =  lodash.uniqBy(orders, function (e) {
        return (e.Display_lng);
      });

      let uniqueOrders = lodash.uniqBy(uniqueByLat, function (e) {
        return (e.Display_lat);
      })
      return uniqueOrders
}

function saveOrderDetails(order,user) {
        order.user_id = user.user_id;
        order.driver_string = user.driver_string;
        if (!order.isPresorted ){
            order.sequence = index + 1
        }
        order.route_started = moment(new Date()).format("yyyy-MM-dd-HH:mm:ss")
       if (order.boxes_scanned_in != order.total_boxes && user.orders_entry_method == 1 ) {
            order.has_problem = 1
       }
       order.save();
}
module.exports = {
    confirm_orders,
    unVisitedOrders,
    uniqueOrders,
    saveOrderDetails
}