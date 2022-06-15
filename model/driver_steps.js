const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const deliverySchema = new Schema({
  _updated_at: Date,
  _created_at: Date,
  step_string: String,
  step_date: Date,
  step_geopoint: [Number],
  user_id: String,
  route_started: String,
  step_type: Number,
},{ collection: 'driver_steps' })
module.exports = mongoose.model('driver_steps', deliverySchema);
