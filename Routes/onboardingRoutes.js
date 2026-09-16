const express = require("express");
const router = express.Router();

const protect = require("../Middleware/auth");
const { onboardCustomer } = require("../Controllers/onboardingController");

router.post("/onboard", protect, onboardCustomer);

module.exports = router;