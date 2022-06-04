const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const driverSchema = new Schema({

    Language: {
        
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
        type: Number,
    },
    end_lon: {
        required: true,
        type: Number,
    },
    eta_to_store: {
        required: true,
        type: String,
    },
    first_name: {
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
    is_segueing: {
        required: true,
        type: Number,
    },
    last_location: {
        required: true,
        type: String,
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
    password: {
        required: true,
        type: Number,
    },
    phone: {
        required: true,
        type: Number,
    },
    previous_stop: {
        required: true,
        type: String,
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
        type: String,
    },
    username: {
        required: true,
        type: String,
    },
    vehicle_type: {
        required: true,
        type: Number,
    },


})
module.exports = mongoose.model('drivers', driverSchema);