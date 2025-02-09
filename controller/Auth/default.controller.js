const userInfo = require("../../model/Auth/user.model");
const messageConfig = require("../../config/message");

exports.createDefaultUser = async (req, res) => {
  try {
    const payload = {
      first_name: "SNS",
      last_name: "IHUB",
      email: "erpihub@snsgroups.com",
      phone: "7358112791",
      password: "12345678",
      role: "admin",
      organization: "",
      status: true,
    };
    const existingUser = await userInfo.find({ email: payload?.email });
    if (existingUser?.length === 0) {
      const newUser = await userInfo.create(payload);
    }
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: messageConfig?.new_users?.error,
    });
  }
};
