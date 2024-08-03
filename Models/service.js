const mongoose=require('mongoose')
let serviceschema=new mongoose.Schema({
    url:String,
    name:String,
})

const SERVICE=mongoose.model('SERVICE',serviceschema)
module.exports=SERVICE;