const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ordersSchema = new Schema({
    ACL: {
        type: String,
    },
    Display_lat: {
        
        type: String,
    },
    Display_lng: {
        
        type: String,
    },
    Geocords: {
        
        type: String,
    },
    boxes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "boxes"
    }],
    boxes_scanned_in: {
        
        type: Number,
    },
    case_descriptions: {
        
        type: String,
    },
    cases: {
        
        type: Number,
    },
    cell1: {
        
        type: String,
    },
    cell2: {
        
        type: String,
    },
    city: {
        
        type: String,
    },
    cod: {
        
        type: String,
    },
    collect: {
        
        type: String,
    },
    contained_boxes: {
        
        type: String,
    },
    date_only_sent_to_device: {
        
        type: String,
    },
    date_sent_to_device: {
        
        type: String,
    },
    datetime_created: {
        
        type: String,
    },
    deleted_from_device: {
        
        type: Number,
    },
    delivery_time_min: {
        
        type: Number,
    },
    desc: {
        
        type: String,
    },
    driver_string: {
        
        type: String,
    },
    dropped_off_info: {
        
        type: String,
    },
    eta: {
        
        type: String,
    },
    fname: {
        
        type: String,
    },
    initial_order_id: {
        
        type: Number,
    },
    is_bad: {
        
        type: Number,
    },
    lname: {
        
        type: String,
    },
    missing_info: {
        
        type: String,
    },
    non_snap_amount: {
        
        type: String,
    },
    not_ready: {
        
        type: String,
    },
    notes: {
        
        type: String,
    },
    order_id: {
        
        type: String,
    },
    phone: {
        
        type: Number,
    },
    report_address_to_here_map: {
        
        type: Number,
    },
    picked: {
        
        type: Number,
    },
    returned: {
        
        type: Number,
    },
    route_finished: {
        
        type: String,
    },
    route_started_utc: {
        
        type: String,
    },
    sale_amount: {
        
        type: String,
    },
    snap_amount: {
        
        type: String,
    },
    sequence: {
        
        type: Number,
    },
    state: {
        
        type: String,
    },
    store_id: {
        
        type: Number,
    },
    street_address: {
        
        type: String,
    },
    total_balance: {
        
        type: String,
    },
    total_boxes: {
        
        type: Number,
    },
    unit: {
        
        type: String,
    },
    user_id: {
        
        type: String,
    },
    visited: {
        
        type: Number,
    },
    zip: {
        
        type: Number,
    },
})

module.exports = mongoose.model('orders', ordersSchema);