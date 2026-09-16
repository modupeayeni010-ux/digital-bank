const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");

const { interBankTransfer } = require("../Services/nibssService");


// ==========================================
// GET ACCOUNT BALANCE
// ==========================================
const getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    return res.status(200).json({
      message: "Balance retrieved successfully",
      accountNumber: account.accountNumber,
      balance: account.balance,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// ==========================================
// NAME ENQUIRY
// ==========================================
const nameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.body;

    if (!accountNumber) {
      return res.status(400).json({
        message: "Account number is required",
      });
    }

    const account = await Account.findOne({
      accountNumber,
    }).populate("user", "firstName lastName");

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    return res.status(200).json({
      message: "Name enquiry successful",
      accountNumber: account.accountNumber,
      accountName: `${account.user.firstName} ${account.user.lastName}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// ==========================================
// INTRA-BANK TRANSFER
// ==========================================
const transferIntraBank = async (req, res) => {
  try {
    const { receiverAccountNumber, amount } = req.body;

    if (!receiverAccountNumber || !amount) {
      return res.status(400).json({
        message: "Receiver account number and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Transfer amount must be greater than zero",
      });
    }

    // Find sender's account
    const senderAccount = await Account.findOne({
      user: req.user._id,
    });

    if (!senderAccount) {
      return res.status(404).json({
        message: "Sender account not found",
      });
    }

    // Find receiver's account
    const receiverAccount = await Account.findOne({
      accountNumber: receiverAccountNumber,
    });

    if (!receiverAccount) {
      return res.status(404).json({
        message: "Receiver account not found",
      });
    }

    // Prevent transfer to same account
    if (
      senderAccount._id.toString() === receiverAccount._id.toString()
    ) {
      return res.status(400).json({
        message: "You cannot transfer to your own account",
      });
    }

    // Check balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Move money
    senderAccount.balance -= amount;
    receiverAccount.balance += amount;

    await senderAccount.save();
    await receiverAccount.save();

    // Create transaction reference
    const reference = `TXN-${Date.now()}`;

    // Save transaction
    const transaction = await Transaction.create({
      sender: senderAccount._id,
      receiver: receiverAccount._id,
      amount,
      type: "intra-bank",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Transfer successful",
      reference: transaction.reference,
      amount: transaction.amount,
      status: transaction.status,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// ==========================================
// INTER-BANK TRANSFER
// ==========================================
const transferInterBank = async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (!to || !amount) {
      return res.status(400).json({
        message: "Receiver account number and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Transfer amount must be greater than zero",
      });
    }

    // Find sender's account
    const senderAccount = await Account.findOne({
      user: req.user._id,
    });

    if (!senderAccount) {
      return res.status(404).json({
        message: "Sender account not found",
      });
    }

    // Check balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Send transfer request to NIBSS
    const nibssResponse = await interBankTransfer(
      senderAccount.accountNumber,
      to,
      amount
    );

    // Deduct money after successful NIBSS response
    senderAccount.balance -= amount;

    await senderAccount.save();

    // Create transaction reference
    const reference = `TXN-${Date.now()}`;

    // Save inter-bank transaction
    const transaction = await Transaction.create({
      sender: senderAccount._id,
      receiverAccountNumber: to,
      amount,
      type: "inter-bank",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Inter-bank transfer successful",
      reference: transaction.reference,
      from: senderAccount.accountNumber,
      to,
      amount,
      status: transaction.status,
      response: nibssResponse,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Inter-bank transfer failed",
      error: error.message,
    });
  }
};


// ==========================================
// TRANSACTION STATUS
// ==========================================
const getTransactionStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        message: "Transaction reference is required",
      });
    }

    const transaction = await Transaction.findOne({
      reference,
    }).populate("sender receiver", "accountNumber");

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // Find logged-in customer's account
    const userAccount = await Account.findOne({
      user: req.user._id,
    });

    if (!userAccount) {
      return res.status(403).json({
        message: "You are not authorized to view this transaction",
      });
    }

    // Check if customer is involved in transaction
    const senderId = transaction.sender
      ? transaction.sender._id.toString()
      : null;

    const receiverId = transaction.receiver
      ? transaction.receiver._id.toString()
      : null;

    if (
      senderId !== userAccount._id.toString() &&
      receiverId !== userAccount._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to view this transaction",
      });
    }

    return res.status(200).json({
      message: "Transaction status retrieved successfully",
      reference: transaction.reference,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      sender: transaction.sender
        ? transaction.sender.accountNumber
        : null,
      receiver: transaction.receiver
        ? transaction.receiver.accountNumber
        : transaction.receiverAccountNumber,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
// ==========================================
// GET TRANSACTION HISTORY
// ==========================================
const getTransactionHistory = async (req, res) => {
  try {
    // Find the logged-in customer's account
    const account = await Account.findOne({
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Find transactions involving this account
    const transactions = await Transaction.find({
      $or: [
        { sender: account._id },
        { receiver: account._id },
      ],
    })
      .populate("sender", "accountNumber")
      .populate("receiver", "accountNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Transaction history retrieved successfully",
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
  getBalance,
  nameEnquiry,
  transferIntraBank,
  transferInterBank,
  getTransactionStatus,
  getTransactionHistory,
};