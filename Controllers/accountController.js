const Account = require("../Models/Account");

const createAccount = async (req, res) => {
  try {
    // Get the logged-in user
    const user = req.user;

    // Customer must be verified before creating an account
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Customer must complete BVN/NIN verification first",
      });
    }

    // Check if the customer already has an account
    const existingAccount = await Account.findOne({
      user: user._id,
    });

    if (existingAccount) {
      return res.status(400).json({
        message: "Customer already has an account",
      });
    }

    // Generate a simple 10-digit account number
    const accountNumber =
      "20" + Math.floor(10000000 + Math.random() * 90000000);

    // Create the account with ₦15,000
    const account = await Account.create({
      user: user._id,
      accountNumber,
      balance: 15000,
    });

    return res.status(201).json({
      message: "Account created successfully",
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        status: account.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createAccount,
};