const mongoose=require('mongoose')
let userschema=new mongoose.Schema({
    firstname:String,
    lastname:String,
    email:String,
    phone:String,
    password:String,
    gender:String,
})

const USER=mongoose.model('USER',userschema)
module.exports=USER;