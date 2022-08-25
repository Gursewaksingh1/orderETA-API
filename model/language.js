const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const languageSchema = new Schema(
  {
    language_id: { type: Number, required: true },
    language_name: { type: String, required: true },
    language_translation: { type: String, required: true },
  },
  { collection: "language" }
);
module.exports = mongoose.model("language", languageSchema);
