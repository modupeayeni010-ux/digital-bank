const express = require("express");

const router = express.Router();

const {
  register,
  login,
  resetPassword
} = require("../Controllers/authController");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

router.post("/reset-password", resetPassword);

module.exports = router;