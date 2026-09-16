const express = require("express");
const router = express.Router();

const protect = require("../Middleware/auth");
const { createAccount } = require("../Controllers/accountController");

router.post("/create", protect, createAccount);

module.exports = router;