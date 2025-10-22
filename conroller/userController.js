const User = require("../models/userModel");
const bcrypt = require("bcrypt")

const userRegister = async (req, res) => {
    try {
        console.log(req.body)
        const { name, email, password } = req.body;
        if (!name, !email, !password) {
            return res.json({ success: false, message: "all fields are required" });
        }
        const checkUser = await User.findOne({ email })
        if (checkUser) {
            return res.json({ success: false, message: "user already exists" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const createUser = await User.create({
            name,
            email,
            password: hashedPassword
        })
        createUser.save()
        return res.json({ success: true, data: createUser });
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

const userLogin = async (req, res) => {
    try {
        console.log(req.body);
        
    } catch (error) {
        
    }
}

module.exports = { userRegister }