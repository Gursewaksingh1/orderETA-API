const Boxes = require("../model/boxesModel");
const Orders = require("../model/ordersModel");

exports.searchOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    //fetching orders according to id
    let order = await Orders.find({ order_id: orderId }).populate("boxes");
    //checking order obj is empty or not
    if (order.length !== 0) {
      res.status(201).send({ status: "success", order: order });
    } else {
      res
        .status(400)
        .send({ status: "failed", error: "please send valid order id" });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const driverId = req.body.driverId
      //fetching orders according to id

    let order = await Orders.find({ order_id: orderId });
    if (order.length !== 0) {
         let boxesIds = order[0].boxes
         //looping to update each box with driver id
         
         for(i=0;i<boxesIds.length;i++) {
           data =  await Boxes.findOneAndUpdate({_id:boxesIds[i].toHexString()},
           {$set:{"status.driver_id":driverId}})
        }
      res
        .status(200)
        .send({
          status: "success",
          message: "orders have been assigned to related driver",
        });
    } else {
      res
        .status(400)
        .send({ status: "failed", error: "please send valid order id" });
    }
  } catch (err) {
    res
    .status(400)
    .send({ status: "failed", error: err});
  }
};
