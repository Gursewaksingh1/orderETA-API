const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const debug_tempSchema = new Schema(
  {
    temp_desc: { type: String, required: true },
    userId: { type: String, required: true },
    _updatedAt: { type: Date, required: true },
    _createdAt: { type: Date, required: true },
  },
  { collection: "debug_temp" }
);
module.exports = mongoose.model("debug_temp", debug_tempSchema);
