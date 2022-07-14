const mongoose = require('mongoose');
const _User = require('./user');
const Schema = mongoose.Schema;
const user_imageSchema = new Schema({
    Image:{
        type:Buffer,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    date:{
        type:Date
    }
})
module.exports = mongoose.model('_User_Image', user_imageSchema);