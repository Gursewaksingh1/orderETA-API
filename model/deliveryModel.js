const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const deliverySchema = new Schema({
    order_id: {
        type:Number
    },
    box_id: {
        type: Number
    },
    start_lat: {
        required: true,
        type: String,
    },
    start_lon: {
        required: true,
        type: String,
    },
    end_lat: {
        required: true,
        type: String,
    },
    end_lon: {
        required: true,
        type: String,
    },

})
module.exports = mongoose.model('delivery', deliverySchema);