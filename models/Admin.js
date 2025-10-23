const mongoose = require("mongoose")

const adminSchema = mongoose.Schema({
    name:String,
    email:String,
    password:String
})

module.exports = mongoose.model("adminModel", adminSchema)