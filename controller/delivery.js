const Delivery = require("../model/deliveryModel");
const User = require("../model/_User");
const DriverSteps = require("../model/driver_steps");
exports.startDelivery = async (req, res) => {
  let {
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
    step_string,
  } = req.body;
  let userId = req.user.userId;
  let today = new Date();
  let currentDateAndTime = today.toISOString();
  try {
    //console.log(req.user.userId);
    const user = await User.findOne({ _id: userId });
console.log(user.end_lat == undefined || null || "1" &&user.end_lon ==undefined || null || "2");
    // if(user.end_lat == undefined || null || 0 &&user.end_lon ==undefined || null || 0) {
    if (!user.end_lat && !user.end_lon) {
      console.log("vhgcvyjfcghvbj");
      //if end latitude and longitude is not defined means delivery is just begins and update them
      const user = await User.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            start_lat: startLatitude,
            start_lon: startLongitude,
            end_lat: endLatitude,
            end_lon: endLongitude,
            last_location: [startLongitude, startLatitude],
            original_route_started:
              currentDateAndTime.slice(0, 10) +
              "-" +
              currentDateAndTime.slice(12, 20),
            started_driving:
              currentDateAndTime.slice(0, 10) +
              "-" +
              currentDateAndTime.slice(12, 20),
          },
        }
      );
      //console.log(user);
    } else {
      const user = await User.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            last_location: [startLongitude, startLatitude],
            latest_action: step_string,
          },
        }
      );
    }
    // creating first driver Step document
    const driverSteps = new DriverSteps({
      step_date: new Date(),
      route_started:
        currentDateAndTime.slice(0, 10) +
        "-" +
        currentDateAndTime.slice(12, 20),
      step_geopoint: [startLongitude, startLatitude],
      user_id: req.user.userId,
      step_string: step_string,
      step_type: 1,
      _created_at: new Date(),
      _updated_at: new Date(),
    });
    driverSteps.save();
    res.status(201).send({
      staus: "success",
      message: "user gets the address of destination successfully",
    });
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

exports.deleteDelivery = async (req, res) => {
  try {
    result = await Delivery.deleteOne({ _id: req.query.id });
    if (result.deletedCount > 0) {
      res.status(200).send({
        staus: "success",
        message: "delivery record deleted successfully",
      });
    } else {
      res.status(400).send({ status: "failed", error: "please send valid id" });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", error: err });
  }
};
