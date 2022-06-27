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
  let msg;
  let success_status,failed_status
  try {
    // fetching user
    const user = await User.findOne({ _id: userId });
    

     
    if (!user.end_lat || !user.end_lon) {
      //if end latitude and longitude is not defined means delivery is just begins and update them
      const user_update = await User.findOneAndUpdate(
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
       // checking for user language
       if(user.Language ==1) {
        success_status =  process.env.SUCCESS_STATUS_ENGLISH
        failed_status = process.env.FAILED_STATUS_ENGLISH
        msg = process.env.NEW_DELIVERY_MSG_ENGLISH
      } else if(user.Language ==2){
        success_status =  process.env.SUCCESS_STATUS_SPANISH 
        failed_status = process.env.FAILED_STATUS_SPANISH 
        msg = process.env.NEW_DELIVERY_MSG_SPANISH
      } else {
        success_status =  process.env.SUCCESS_STATUS_ENGLISH
        failed_status = process.env.FAILED_STATUS_ENGLISH
        msg = process.env.NEW_DELIVERY_MSG_ENGLISH
      }
//status code
      statusCode=201
    } else {
      const user_update = await User.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            last_location: [startLongitude, startLatitude],
            latest_action: step_string,
          },
        }
      );
      if(user.Language ==1) {
        success_status =  process.env.SUCCESS_STATUS_ENGLISH
        failed_status = process.env.FAILED_STATUS_ENGLISH
        msg = process.env.UPDATE_DELIVERY_MSG_ENGLISH
      } else if(user.Language ==2){
        success_status =  process.env.SUCCESS_STATUS_SPANISH 
        failed_status = process.env.FAILED_STATUS_SPANISH 
        msg = process.env.UPDATE_DELIVERY_MSG_SPANISH
      } else {
        success_status =  process.env.SUCCESS_STATUS_ENGLISH
        failed_status = process.env.FAILED_STATUS_ENGLISH
        msg = process.env.UPDATE_DELIVERY_MSG_ENGLISH
      }
      //status code
      statusCode=200 
    }
    // creating first driver Step document
    const driverSteps = new DriverSteps({
      step_date: new Date(),
      route_started: user.original_route_started,
      step_geopoint: [startLongitude, startLatitude],
      user_id: req.user.userId,
      step_string: step_string,
      step_type: 1,
      _created_at: new Date(),
      _updated_at: new Date(),
    });
    driverSteps.save();
    res.status(201).send({
      staus: success_status,
      statusCode,
      message: msg,
    });
  } catch (err) {
    res.status(400).send({ status:failed_status,statusCode:400, error: err });
  }
};



