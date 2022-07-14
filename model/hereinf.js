const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const hereinfSchema = new Schema(
  {
    _id: String,
    updatedAt: Date,
    createdAt: Date,
    AppID: String,
    AppCode: String,
    sdk_app_id: String,
    sdk_app_code: String,
    sdk_license_key: String,
    WSEurl: String,
    routingURL: String,
  },
  { collection: "HereInf" }
);
module.exports = mongoose.model("HereInf", hereinfSchema);
