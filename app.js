const express = require("express");
const cors = require("cors");

const authRoutes = require("./Routes/authRoutes");
const protect = require("./Middleware/auth");
const onboardingRoutes = require("./Routes/onboardingRoutes");
const accountRoutes = require("./Routes/accountRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to our Digital Bank API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transactions", transactionRoutes);

// Protected Route
app.get("/api/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Welcome to your profile",
    user: req.user,
  });
});

module.exports = app;