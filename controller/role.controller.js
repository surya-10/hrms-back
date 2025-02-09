const db = require("../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const { createLog } = require("./activity.controller");

const userInfo = db.user;
const userSessionInfo = db.session;
const roleInfo = db.role;
const profileInfo = db.profile;
const professionInfo = db.profession;

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

exports.createRole = async (req, res) => {
  try {
    const { role_name, role_value } = req.body;

    const getRole = await roleInfo?.find({ role_value: role_value });

    if (getRole?.length > 0) {
      return res.status(200).send({
        status: 200,
        message: "Role Already Exits in Database",
      });
    } else {
      const newUserRole = new roleInfo({
        role_name,
        role_value,
      });

      await newUserRole.save();

      res.status(200).send({
        message: "New Role Created Successfully",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: 500,
      error: error?.message,
      message: "Error Creating During New Role",
    });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const data = await roleInfo?.find();
    return res.status(200).json({ roleList: data });
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "Error fetching the Role List",
    });
  }
};

// Soft delete a user by ID
exports.deleteRole = async (req, res) => {
  try {
    const id = req.params.id;

    const role = await roleInfo.findById(id);
    if (!role) {
      return res.status(200).send({
        message: "Role Does not exists",
      });
    }

    const roleId = role?._id;

    const users = await userInfo
      .find({ is_deleted: false }, { password: 0 })
      .populate(["profession_id", "profile_id", "role"]);

    const filterData = users?.filter(
      (x) => x?.role?.id?.toString() === roleId?.toString()
    );

    if (filterData?.length === 0) {
      const deleteRole = await roleInfo.deleteOne({ _id: roleId });
      res.send({
        message: "Role Deleted Successfully",
        status: 200,
      });
    } else {
      res.send({
        message: "Role is Already Linked with some users",
        status: 200,
      });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).send({
      message: "Could not delete Role with id=",
    });
  }
};
