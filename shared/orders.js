const moment = require("moment");

const lodash = require("lodash");
function confirm_orders(orders) {
    let acceptedStatus = ["IN_STORE", "RETURNED", "NOT_CONFIRMED", "NOT_SCANNED_OUT", "NOT_DELIVERED", "MANUALLY_DELETED"]
    orders.forEach(order => {
       
        order.boxes.forEach(box => {
            if(acceptedStatus.includes(box.status.type) && order.visited != 1 && order.returned != 1) {
                box.status.type = "MANUALLY_CONFIRMED";
                box.status.description = "Order has been automatically confirmed when driver pressed the cloud button.";
                box.status.driver_id = userId;

            }
            
        })
        order.save();
    })

}

function unvisitedorders(orders) {
    let Orders = []
    orders.forEach(order => {
        if(order.visited !== 1) {
            Orders.push(order)
        }
    })
    return Orders
}

function uniqueorders(orders) {
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
function removeOrdersAtCancelRoute(orders,userId) {
    let acceptedStatus = ["SCANNED_IN", "MANUALLY_CONFIRMED"]
    orders.forEach(order => {
        order.boxes.forEach(box => {
            if(acceptedStatus.includes(box.status.type)) {
                box.status.type = "MANUALLY_DELETED";
                box.status.description = "Box was manually deleted from the driver's device.";
                box.status.driver_id = userId;
            }
        })
        order.deleted_from_device = 1;
        order.save();
    })
}

function markDeliveredAtCancelRoute(orders,userId,latitude,longitude) {
    let scannedAcceptedStatus = ["SCANNED_IN"]
    let manualAcceptedStatus = ["MANUALLY_CONFIRMED"]
    
    orders.forEach(order => {
        order.boxes.forEach(box => {
            if(scannedAcceptedStatus.includes(box.status.type)) {
                box.status.type = "MANUALLY_SCANNED_OUT";
                box.status.description = "Box was manually deleted from the driver's device.";
                box.status.driver_id = userId;

            } else if(manualAcceptedStatus.includes(box.status.type)) {
                box.status.type = "MANUALLY_DELIVERED";
                box.status.driver_id = userId;
            }
    }) 
    order.visited = 1;
    order.eta = new Date()
    order.notes = order.notes+ " Driver deleted whole route and marked all orders as delivered"
    order.dropped_off_info = [`50,"${latitude}, ${longitude},123.56,1`]
    order.save()
})
}

function saveForFutureDeliveryCancelRoute(orders,userId,driverString) {

    orders.forEach(order => {
        order.boxes.forEach(box => {
            if(box.status.type == "SCANNED_IN") {
                box.status.type = "NOT_SCANNED_OUT";
                box.status.description = "Driver saved order for future delivery.";
                box.status.driver_id = userId;
            } else if (box.status.type == "MANUALLY_CONFIRMED") {
                box.status.type = "NOT_DELIVERED";
                box.status.description = "Driver saved order for future delivery.";
                box.status.driver_id = userId;
            }
        })

        order.driver_string = driverString
        order.date_sent_to_device =  moment(new Date()).format("yyyy-MM-dd-HH:mm:ss")
        order.save();
    }) 
}
module.exports = {
    confirm_orders,
    unvisitedorders,
    uniqueorders,
    saveOrderDetails,
    removeOrdersAtCancelRoute,
    markDeliveredAtCancelRoute,
    saveForFutureDeliveryCancelRoute
}