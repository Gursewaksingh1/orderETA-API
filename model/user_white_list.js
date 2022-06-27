const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logout_Schema = new Schema({
    userId:{
       type:String,
       required:true
    },
    token:{
        type:String,
        required:true
     },
     refreshToken:{
        type:String,
        required:true
     },
     user_IP_address:{
        type:String,
        required:true
     }

})

module.exports = mongoose.model('logout', logout_Schema);