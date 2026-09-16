const express = require("express");
const router = express.Router();

const protect = require("../Middleware/auth");
const {
  getBalance,
  nameEnquiry,
  transferIntraBank,
  getTransactionStatus,
  transferInterBank,
  getTransactionHistory,
} = require("../Controllers/transactionController");

router.get("/balance", protect, getBalance);

router.post("/name-enquiry", protect, nameEnquiry);

router.post("/transfer/intra-bank", protect, transferIntraBank);

router.get("/status/:reference", protect, getTransactionStatus);

router.post("/transfer/inter-bank", protect, transferInterBank);

router.get("/history", protect, getTransactionHistory);

module.exports = router;