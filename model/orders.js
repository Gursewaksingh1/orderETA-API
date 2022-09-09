const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ordersSchema = new Schema({
    
    _id: {
        required:true,
        type:String
    },
    _updated_at:{
        type:Date
    },
    _rperm: {
        type:Array
    },
    _wperm:{
       
        type:Array
    },
    boxes:[{
        case_description:{
            type:String
        },
        is_case: {
            type:Boolean
        },
        number:{
            type:Number
        },
       
        status :{
            description:{type: String},
            driver_id:{type: String},
            type:{type: String},
        }
    }],
    boxes_scanned_in:{
        type: Number,
    },
    boxes_scanned_out:{
        type: Number,
    },
    createdAt:{
        type:String,
    },
    city: {
        type:String,
    },
    collect: {
        type:String,
    },
    cod: {
        type:String
    },
    case_descriptions: {
        
        type: Array,
    },
    cases: {
        
        type: Number,
    },
    cell1: {
        index: true,
        type: String,
    },
    cell2: {
        index: true,
        type: String,
    },
    contained_boxes: {
        
        type: String,
    },
    datetime_created: {
        type:String,
    },
    DeliveryDate:{
        type:String,
    },
    deleted_from_device:{
        type:Number
    },
    desc: {
        type:String
    },
    Display_lat: {
        
        type: Number,
    },
    Display_lng: {
        
        type: Number,
    },
    driver_string:{
        type:String
    },
    dropped_off_info:{
        type:Array
    },
    date_only_sent_to_device: {
        
        type: String,
    },
    driver_notes: String,
    date_sent_to_device: {
        
        type: String,
    },
    delivery_time_min: {
        
        type: Number,
    },
    desc: {
        
        type: String,
    },
    eta_assign:{
        type:String
    },
    eta:{
        type:Date
    },
   
    
    fname: {
        
        type: String,
        index: true
    },
    Geocords: {
        
        type: Array,
    },
    initial_order_id: {
        
        type: Number,
    },
    is_bad: {
        
        type: Number,
    },
    lname: {
        type: String,
        index: true
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
        index: true,
        type: String,
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
    route_started: {
        
        type: String,
    },
    sale_amount: {
        
        type: String,
    },
    snap_amount: {
        
        type: String,
    },
    Seq:{
        type: String, 
    },
    sequence: {
        
        type: Number,
    },
    status:String,
    statusKey:String,
    state: {
        
        type: String,
    },
    store_id: {
        
        type: Number,
    },
    street_address: {
        index: true,
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
    updatedAt: {
        type:Date
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