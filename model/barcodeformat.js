const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const barcode_formatSchema = new Schema(
  {
    barcode_id: { type: String, required: true,unique:true,index: true },
    barcode_type: { type: String, required: true },
    barcode_format: { type: String, required: true },
  },
  { collection: "barcode_format" }
);
module.exports = mongoose.model("barcode_format", barcode_formatSchema);
