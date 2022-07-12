const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const reasonSchema = new Schema(
  {
    _id: String,
    updatedAt: Date,
    createdAt: Date,
    type: String,
    text: String,
  },
  { collection: "reason" }
);
module.exports = mongoose.model("reason", reasonSchema);
