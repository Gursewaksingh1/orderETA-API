const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const driver_actionsSchema = new Schema(
  {
    updatedAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    action: { type: String, required: true },
    action_location: { type: Array, required: true },
    user_id: { type: String, required: true },
    action_date: { type: String, required: true },
  },
  { collection: "driver_actions" }
);
module.exports = mongoose.model("driver_actions", driver_actionsSchema);
