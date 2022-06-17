const boxesModel = require("../model/boxesModel");
const Boxes = require("../model/boxesModel");
const Orders = require("../model/ordersModel");

//fetching all user's orders
exports.getOrders = async (req, res) => {
  let order_per_page = 10;
  let pageNo = req.query.page;

  try {
    if (pageNo < 1 || null || undefined) {
      return res.status(400).send({
        status: "failed",
        error: "page number must be a natural number",
      });
    }
    const orders = await Orders.find({ user_id: req.user.userId })
      .skip((pageNo - 1) * order_per_page)
      .limit(order_per_page);
    res.status(201).send({ status: "success", data: orders });
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

//fetching user order by order id
exports.getOrderByOrderId = async (req, res) => {
  try {
    const order = await Orders.findOne({ order_id: req.params.orderId });
    res.status(201).send({ status: "success", data: order });
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};
//fetching user order by Seq
exports.getOrderBySeq = async (req, res) => {
  console.log(req.user.userId, req.params.Seq);
  seq = req.params.Seq
  try {
    console.log("kjghdiousgadosgv");
    const orders = await Orders.find({
      $and: [{ user_id: req.user.userId }, { Seq: seq.toString() }],
    });
    res.status(201).send({ status: "success", data: orders });
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

//fetching user order by current Date
exports.getOrderByCurrentDate = async (req, res) => {
  try {
    console.log(req.user.userId);
    //fetching reords which is eta only today
    const orders = await Orders.find({
      user_id: req.user.userId,
      $and: [
        { eta: { $gte: new Date().setHours(0, 0, 0, 0) } },
        { eta: { $lt: new Date().setHours(23, 59, 59, 0) } },
      ],
    });

    res.status(201).send({ status: "success", data: orders });
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

exports.update_order_boxes = async (req, res) => {
  let { orderId, desc, type } = req.body
  try {

  } catch (err) {
    console.log(err);
  }
}
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
    const driverId = req.user.userId;
    let boxIds = [];
    //fetching orders according to id

    let order = await Orders.findOne({ order_id: orderId });
    if (order.boxes.length !== 0) {
      for (i = 0; i < order.boxes.length; i++) {
        boxIds.push(order.boxes[i]._id)
      }
      //looping to update each box with driver id
      await Orders.findOne({ order_id: orderId })
        .then(res => {
          for (i = 0; i < boxIds.length; i++) {
            res.boxes[i].status.driver_id = driverId
          }
          res.save()
        })
      res.status(200).send({
        status: "success",
        message: "orders have been assigned to related driver",
      });
    } else {
      res
        .status(400)
        .send({ status: "failed", error: "please send valid order id" });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};
