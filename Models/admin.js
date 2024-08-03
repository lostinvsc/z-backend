const mongoose=require('mongoose')
let adminschema=new mongoose.Schema({
    email:String,
    password:String,
})

const ADMIN=mongoose.model('ADMIN',adminschema)
module.exports=ADMIN;