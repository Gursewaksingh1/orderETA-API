const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const logged_routing_requestsSchema = new Schema(
  {
    updatedAt: Date,
    createdAt: Date,
    store_id: Number,
    driver_name: String,
    url_date: Date,
    route_started: String,
    the_url: String,
    the_result: String,
  },
  { collection: "logged_routing_request" }
);
module.exports = mongoose.model(
  "logged_routing_request",
  logged_routing_requestsSchema
);
