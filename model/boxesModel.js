const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const boxesSchema = new Schema({
    case_description:{
        type:String
    },
    is_case: {
        type:Number
    },
    number:{
        type:Number
    },
    status :{
        description:{type: String},
        driver_id:{type: String},
        type:{type: String},
    }
})

module.exports = mongoose.model('boxes', boxesSchema);