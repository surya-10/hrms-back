const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { createLog } = require("./activity.controller");
const messageConfig = require("../../config/message");
// const { getMonths } = require("./employee.leave.recorder.controller");
dotenv.config();
const employeeLeaveInfo = db.leaveRecords;

const userInfo = db.user;
const userSessionInfo = db.session;
const roleInfo = db.role;
const profileInfo = db.profile;
const professionInfo = db.profession;


async function getMonths(date) {
  try {
    const [targetDay, targetMonth, targetYear] = date.split('-');
    const leaveEntries = await employeeLeaveInfo.find();
    const matchingDates = [];
    leaveEntries.forEach(entry => {
      entry.date.forEach(dateStr => {
        const [day, month, year] = dateStr.split('-');
        if (month === targetMonth && year === targetYear && day === targetDay) {
          matchingDates.push(dateStr);
        }
      });
    });
    return matchingDates;
  } catch (error) {
    throw new Error("Error occured while Fetching Months");

  }
}

async function createNewProfile(userId) {
  const newProfile = new profileInfo({
    user_id: userId,
    status: true,
  });

  await newProfile.save();
  return newProfile;
}

async function getRoleInfo(params) {
  const getUsers = await userInfo?.find({ _id: params });
  const getRole = await roleInfo?.find({ _id: getUsers[0]?.role });
  return getRole[0]?.role_name || {};
}

async function getRoleName(params) {
  const getRole = await roleInfo?.find({ role_name: params });
  return getRole[0]?._id || {};
}

async function createNewProfession(userId, profileId) {
  const newProfession = new professionInfo({
    user_id: userId,
    profile_id: profileId,
    current_employment: "Active",
    status: true,
  });

  await newProfession.save();
  return newProfession;
}

exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role, manager_id } = req.body;
    console.log(first_name, last_name, email, phone, password, role, manager_id )

    const getRole = await roleInfo?.find({ role_value: role });

    const userRole = getRole[0]?._id;

    if (!first_name || !email || !password) {
      return res.status(400).send({
        status: 400,
        message: messageConfig?.new_users?.required,
      });
    }

    const existingUser = await userInfo.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        status: 200,
        message: "Email Already Exits in Database",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user
    const newUser = new userInfo({
      first_name,
      last_name,
      email,
      phone,
      password,
      role: userRole,
      manager_id
    });

    await newUser.save();

    const addProfile = await createNewProfile(newUser?._id);

    const addProfession = await createNewProfession(
      newUser?._id,
      addProfile?._id
    );

    newUser["profile_id"] = addProfile?._id;

    newUser["profession_id"] = addProfession?._id;

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userDetails = await userInfo.findOne({ email });

    await userSessionInfo.create({
      user_id: userDetails._id,
      access_token: token,
    });

    res.status(200).send({
      email: userDetails.email,
      user_id: userDetails._id,
      username: userDetails.first_name,
      role: userDetails.role,
      accessToken: token,
      message: "New User Created Successfully",
    });
  } catch (error) {
    res.status(500).send({
      status: 500,
      error: error?.message,
      message: "Error Creating During New Users",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const users = await userInfo
      .find({ is_deleted: false }, { password: 0 })
      .populate(["profession_id", "profile_id", "role"]);

    const currentRole = await getRoleInfo(req?.userId);

    let userArray = [];

    if (currentRole === "Admin") {
      const res = await getRoleName(currentRole);
      const filterData = users?.filter(
        (x) => x?.role?.role_name === currentRole
      );
      userArray = filterData;
    } else if (currentRole === "User") {
      const res = await getRoleName(currentRole);
      const filterData = users?.filter(
        (x) => x?.role?.role_name === currentRole
      );
      userArray = filterData;
    } else if (currentRole === "HR") {
      const res = await getRoleName(currentRole);
      const filterData = users?.filter((x) => x?.role?.role_name !== "Admin");
      userArray = filterData;
    } else if (currentRole === "Manager") {
      const res = await getRoleName(currentRole);
      const filterData = users?.filter((x) => x?.role?.role_name === "User");
      userArray = filterData;
    }

    if (users.length === 0) {
      return res.status(200).send({
        status: 200,
        message: "Users List Retrieved",
      });
    }

    res.status(200).json({ userList: userArray });
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "Error Fetching Users List",
    });
  }
};

exports.listUserDetails = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await userInfo
      .findById(id, { password: 0 })
      .populate(["profession_id", "profile_id", "role"]);

    if (!data || data.is_deleted) {
      return res
        .status(404)
        .send({ message: "The Selected User is Deleted or In Active" + id });
    }

    const usersInfo = {
      first_name: data?.first_name,
      last_name: data?.last_name,
      email: data?.email,
      phone: data?.phone,
    };

    const userDetails = [
      {
        users: usersInfo,
        role: data?.role,
        profession: data?.profession_id,
        profile: data?.profile_id,
      },
    ];

    // Return user data
    return res.status(200).json({ userDetails: userDetails });
  } catch (error) {
    // Handle error
    res.status(500).send({
      status: 500,
      message: "Error fetching the Users Details" + id,
    });
  }
};

// Update user details by ID
exports.updateUserDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const { first_name, last_name, email, phone, role, status } = req.body;
    const user = await userInfo
      .findByIdAndUpdate(
        id,
        {
          first_name,
          last_name,
          email,
          phone,
          role,
          status,
        },
        { new: true }
      )
      .select("-password");
    if (!user || user.is_deleted) {
      return res.status(200).send({ message: "Error Updating the Users" + id });
    }
    res.status(200).json({ message: "User Details Updated" });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong" + id,
    });
  }
};

// Soft delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userInfo.findById(id);
    if (!user) {
      return res.status(200).send({
        message: "Something went wrong while deleting the users",
      });
    }
    user.is_deleted = true;
    user.deleted_at = new Date();
    user.status = false;
    await user.save();

    res.send({
      message: "User Deleted Successfully",
      status: 200,
    });
  } catch (error) {
    res.status(500).send({
      message: "Could not delete User with id=" + id,
    });
  }
};

// Function to log in a user

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)

    if (!email || !password) {
      return res.status(400).send({
        status: 400,
        message: messageConfig?.login?.required,
      });
    }
    console.log("chek1")

    const userDetails = await userInfo.findOne({ email }).populate(["role", "profession_id", "profile_id"]);
    console.log(userDetails, "Details")
    let count = [];
    let leaveCounts = 0
    if (userDetails.role.role_value == "admin") {
      const users = await userInfo.find();
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-GB").replace(/\//g, "-");

      const counts = await getMonths(formattedDate)
      leaveCounts = counts.length
      count = users;
    }

    if (!userDetails) {
      return res
        .status(401)
        .json({ message: messageConfig?.login?.userNotFound });
    }

    if (userDetails.is_deleted) {
      return res
        .status(403)
        .json({ message: messageConfig?.login?.userDeactivated });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userDetails.password
    );
    console.log(isPasswordValid)

    if (!isPasswordValid) {
      return res.status(401).json({ message: messageConfig?.login?.failure2 });
    }
    const token = jwt.sign(
      { 
        id: userDetails._id,
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: '24h' // 24 hours
      }
    );

    const existingSession = await userSessionInfo.findOne({
      user_id: userDetails._id,
    });

    try {
      if (existingSession) {
        await userSessionInfo.updateOne(
          { user_id: userDetails._id },
          { $set: { access_token: token } }
        );
      } else {
        await userSessionInfo.create({
          user_id: userDetails._id,
          access_token: token,
        });
      }
    } catch (sessionError) {
      return res.status(500).send({
        status: 500,
        message: messageConfig?.login?.failure3,
      });
    }

    // if (responseNew) {
    res.status(200).send({
      email: userDetails.email,
      user_id: userDetails._id,
      username: userDetails.first_name + " " + userDetails.last_name,
      role: userDetails.role,
      accessToken: token,
      profile: userDetails.profile_id,
      profession: userDetails.profession_id,
      user: userDetails.role.role_value == "admin" ? count : "",
      leaveCounts: userDetails.role.role_value == "admin" ? leaveCounts : 0,
      phone: userDetails.phone
    });
    // }
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: messageConfig?.login?.error,
    });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const user_id = req?.userId;

    const { authorization } = req.headers;
    const [authType, authToken] = authorization.split(" ");

    const access_token = authToken;

    if (!access_token) {
      return res.status(400).send({
        status: 400,
        message: "User Id is Invalid",
      });
    }
    const deleteResult = await userSessionInfo.deleteOne({ access_token });
    if (deleteResult.deletedCount === 0) {
      return res.status(400).send({
        status: 400,
        message: "Something went wrong",
      });
    }
    return res.status(200).send({
      status: 200,
      message: "User Logged out",
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Something went wrong",
    });
  }
};


exports.notifyUser = async (req, res) => {
  try {
    const { hr_email, user_email, password } = req.body;
    console.log("Sury")

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.pass,
      },
    });

    const mailOptions = {
      from: process.env.email,
      to: user_email,
      cc: hr_email,
      subject: "Account created and activated successfully",
      html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #f4f7f6; padding: 20px; color: #333; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; font-size: 24px; text-align: center;">Welcome to the Team!</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">Your account has been successfully created and activated. Below are your login credentials:</p>
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Email:</strong> <span style="color: #007BFF;">${user_email}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Password:</strong> <span style="color: #FF5722;">${password}</span></p>
            </div>
            <p style="font-size: 16px; color: #555;">Please keep this information safe and secure.</p>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 16px; color: #555;">Best Regards,</p>
              <p style="font-size: 16px; color: #555;">Your HR Team</p>
            </div>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        return res.status(500).send({
          message: "Error sending email.",
        });
      } else {
        return res.status(201).send({
          message: "Account notification sent successfully",
          data: {
            user_email,
            hr_email,
          },
        });
      }
    });
  } catch (error) {
    console.log("Error in notifyUser:", error);
    return res.status(500).send({
      message: "An error occurred.",
    });
  }
};

exports.updateEmergencyContacts = async (req, res) => {
    try {
        const userId = req.params.id;
        const { emergency_contact } = req.body;

        // Find the user and their profile
        const user = await userInfo.findById(userId);
        if (!user) {
            return res.status(404).send({
                ok: false,
                message: "User not found"
            });
        }

        // Update the emergency contacts in the profile
        const profile = await profileInfo.findByIdAndUpdate(
            user.profile_id,
            { emergency_contact },
            { new: true }
        );

        if (!profile) {
            return res.status(404).send({
                ok: false,
                message: "Profile not found"
            });
        }

        res.status(200).send({
            ok: true,
            message: "Emergency contacts updated successfully",
            profile
        });

    } catch (error) {
        res.status(500).send({
            ok: false,
            message: "Error updating emergency contacts",
            error: error.message
        });
    }
};
