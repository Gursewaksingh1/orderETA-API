const Delivery = require("../model/deliveryModel");

exports.postDelivery = async (req, res) => {
  let {
    orderId,
    boxId,
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
  } = req.body;
  let today = new Date();
  let currentDateAndTime = today.toLocaleString("en-GB");
  try {
    const delivery = await Delivery({
      order_id: orderId,
      box_id: boxId,
      start_lat: startLatitude,
      start_lon: startLongitude,
      end_lat: endLatitude,
      end_lon: endLongitude,
      delivery_date: currentDateAndTime.slice(0, 10),
      delivery_time: currentDateAndTime.slice(12, 20),
    });
    result = await delivery.save();
    if (result == undefined || null) {
      res
        .status(400)
        .send({ staus: "failure", message: "record is not saved retry" });
    } else {
      res.status(201).send({
        staus: "success",
        message: "delivery record created successfully",
      });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

exports.updateDelivery = async (req, res) => {
  let { id, endLatitude, endLongitude } = req.body;
  try {
    await Delivery.findOneAndUpdate(
      { _id: id },
      { $set: { end_lat: endLatitude, end_lon: endLongitude } }
    );
    res.status(201).send({
        staus: "success",
        message: "delivery record updated successfully",
      });
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};

exports.deleteDelivery = async(req,res) => {
    try {
        result  = await Delivery.deleteOne({_id:req.query.id})
        if(result.deletedCount >0) {

        res.status(200).send({
            staus: "success",
            message: "delivery record deleted successfully",
          });
        } else {
            res
              .status(400)
              .send({ status: "failed", error: "please send valid id" });
          }
    } catch (err) {
        res.status(400).send({ status: "failed", error: err });
    }
}