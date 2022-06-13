const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    _id:{
        required:true,
         type:String
    },
    Language: {
        required: true,
        type: Number,
    },
    UUID: {
        required: true,
        type: String,
    },
    additional_maps: {
        required: true,
        type: String,
    },
    addresses_yet_to_visit: {
        required: true,
        type: Number,
    },
    app_version: {
        required: true,
        type: String,
    },
    auto_scan: {
        required: true,
        type: Number,
    },
    distanceToHouses: {
        required: true,
        type: Number,
    },
    driver_color: {
        required: true,
        type: String,
    },
    driver_string: {
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
    eta_to_store: {
        required: true,
        type: Date,
    },
    first_name: {
        required: true,
        type: String,
    },
    _hashed_password:{
        required: true,
        type: String,
    },
    is_delivering: {
        required: true,
        type: Number,
    },
    is_scanning: {
        required: true,
        type: Number,
    },
    last_location: {
        required: true,
        type: Array,
    },
    last_name: {
        required: true,
        type: String,
    },
    latest_action: {
        required: true,
        type: String,
    },
    next_stop: {
        required: true,
        type: String,
    },
    new_pass: {
        required: true,
        type: String,
    },
    no_traffic: {
        required: true,
        type: Number,
    },
    orders_dropoff_method: {
        required: true,
        type: Number,
    },
    orders_entry_method: {
        required: true,
        type: Number,
    },
    original_route_started: {
        required: true,
        type: String,
    },
    phone: {
        required: true,
        type: Number,
    },
    previous_stop: {
        required: true,
        type: String,
    },
    _rperm: {
        required:true,
        type:Array
    },
    service_time: {
        required: true,
        type: Number,
    },
    started_driving: {
        required: true,
        type: String,
    },
    store_id: {
        required: true,
        type: Number,
    },
    token: {
        required: true,
        type: String,
    },
    total_addresses_in_run: {
        required: true,
        type: Number,
    },
    username: {
        required: true,
        type: String,
    },
    vehicle_type: {
        required: true,
        type: Number,
    },
    _wperm:{
        required:true,
        type:Array
    },

},{ collection: '_User' })
module.exports = mongoose.model('_User', userSchema);