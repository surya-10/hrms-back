const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
dotenv.config()

const userInfo = db.user;
const userSessionInfo = db.session;
const roleInfo = db.role;
const profileInfo = db.profile;
const professionInfo = db.profession;
const timeoffInfo = db.timeoffhistory;
const attendanceInfo = db.attendance;
const shiftDetailsInfo = db.timeoff;

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
exports.addDetails= async(req, res)=>{
    try {
        let {timeOff} = req.body;
        let addShifts = new shiftDetailsInfo({
            timeoff_details:timeOff
        })
        await addShifts.save();
        await res.status(200).json({messae:"Shift details added successfully", addShifts})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Unable to add shift details", error})
    }
}