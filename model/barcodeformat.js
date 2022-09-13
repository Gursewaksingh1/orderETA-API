const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const barcode_formatSchema = new Schema(
  {
    barcode_id: { type: String, required: true,unique:true,index: true },
    barcode_type: { type: String, required: true },
    barcode_format: { type: String, required: true },
    storeid_available: { type: Boolean, required: true },
    split_with: { type: String, required: true },
    regexformat: { type: String },
    boxno_avaiable: { type: Boolean, required: true },
    drop_last: { type: [Object]},
    drop_first: { type: [Object]},
  },
  { collection: "barcode_format" }
);
module.exports = mongoose.model("barcode_format", barcode_formatSchema);
