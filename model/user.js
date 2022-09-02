const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    _id:{
        required: true,
         type:String
    },
    _created_at:Date,
    Language: {
        
        type: Number,
    },
    UUID: {
        
        type: String,
    },
    additional_maps: {
        
        type: String,
    },
    addresses_yet_to_visit: {
        
        type: Number,
    },
    app_version: {
        
        type: String,
    },
    auto_scan: {
        
        type: Number,
    },
    distanceToHouses: {
        
        type: Number,
    },
    driver_color: {
        
        type: String,
    },
    driver_string: {
        
        type: String,
    },
    disallow_swipe_order_confirm:Number,
    end_lat: {
        
        type: Number,
    },
    end_lon: {
        
        type: Number,
    },
    eta_to_store: {
        
        type: Date,
    },
    first_name: {
        
        type: String,
    },
    _hashed_password:{
        
        type: String,
    },
    is_delivering: {
        
        type: Number,
    },
    is_segueing:Number,
    is_manager: Number,
    is_scanning: {
        
        type: Number,
    },
    last_location: {
        
        type: Array,
    },
    last_name: {
        
        type: String,
    },
    latest_action: {
        
        type: String,
    },
    next_stop: {
        
        type: String,
    },
    new_pass: {
        
        type: String,
    },
    no_traffic: {
        
        type: Number,
    },
    orders_dropoff_method: {
        
        type: Number,
    },
    orders_entry_method: {
        
        type: Number,
    },
    original_route_started: {
        
        type: String,
    },
    phone: {
        
        type: Number,
    },
    previous_stop: {
        
        type: String,
    },
    _rperm: {
        
        type:Array
    },
    returns_to_address: String,
    service_time: {
        
        type: Number,
    },
    started_driving: {
        
        type: String,
    },
    start_lat:Number,
    start_lon:Number,
    store_id: {
        
        type: Number,
    },
    token: {
        
        type: String,
    },
    total_addresses_in_run: {
        
        type: Number,
    },
    _updated_at:Date,
    username: {
        
        type: String,
    },
    vehicle_type: {
        
        type: Number,
    },
    _wperm:{
        
        type:Array
    },

},{ collection: '_User' })
module.exports = mongoose.model('_User', userSchema);