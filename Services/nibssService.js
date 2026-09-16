const axios = require("axios");

const nibssApi = axios.create({
  baseURL: process.env.NIBSS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.NIBSS_API_KEY,
    "x-api-secret": process.env.NIBSS_API_SECRET,
  },
});
// NIBSS FINTECH ONBOARDING
const onboardFintech = async (name, email) => {
  try {
    const response = await nibssApi.post("/api/fintech/onboard", {
      name,
      email,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "NIBSS onboarding failed"
    );
  }
};

// VALIDATE BVN
const validateBvn = async (bvn) => {
  try {
    const response = await nibssApi.post("/api/validateBvn", {
      bvn,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "BVN validation failed"
    );
  }
};

// GET NIBSS BEARER TOKEN
const getNibssToken = async () => {
  try {
    const response = await nibssApi.post("/api/auth/token", {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_API_SECRET,
    });

    return response.data.token;
  } catch (error) {
    throw new Error(
      JSON.stringify(error.response?.data || error.message)
    );
  }
};


// INTER-BANK TRANSFER
const interBankTransfer = async (from, to, amount) => {
  try {
    const token = await getNibssToken();

    const response = await nibssApi.post(
      "/api/transfer",
      {
        from,
        to,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      JSON.stringify(error.response?.data || error.message)
    );
  }
};

module.exports = {
  nibssApi,
  onboardFintech,
  validateBvn,
  getNibssToken,
  interBankTransfer,
};