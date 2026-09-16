const User = require("../Models/User");
const Onboarding = require("../Models/Onboarding");
const { onboardFintech, validateBvn } = require("../Services/nibssService");
// CUSTOMER ONBOARDING
const onboardCustomer = async (req, res) => {
  try {
    const { type, identifier } = req.body;

    // Check onboarding type
    if (!["BVN", "NIN"].includes(type)) {
      return res.status(400).json({
        message: "Onboarding type must be BVN or NIN",
      });
    }

    // Check identifier
    if (!identifier) {
      return res.status(400).json({
        message: `${type} is required`,
      });
    }

    // Get logged-in customer
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: "Customer is already verified",
      });
    }

    // Save onboarding attempt
    const onboarding = await Onboarding.create({
      user: user._id,
      type,
      identifier,
      status: "pending",
    });

    // Validate BVN with NIBSS
if (type === "BVN") {
  const nibssResponse = await validateBvn(identifier);

  onboarding.status = "successful";
  onboarding.response = nibssResponse;
  await onboarding.save();

  user.isVerified = true;
  user.onboardingType = "BVN";
  await user.save();

  return res.status(200).json({
    message: "BVN validated successfully",
    onboardingId: onboarding._id,
    type: onboarding.type,
    status: onboarding.status,
    response: nibssResponse,
  });
}
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  onboardCustomer,
};