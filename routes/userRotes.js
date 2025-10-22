const express = require("express");
const router = express.Router();

const { userRegister } = require("../conrollers/userController")

router.post("/register", userRegister)

module.exports = router;