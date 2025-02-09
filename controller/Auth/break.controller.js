const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
dotenv.config();

const breakInfo = db.breakRecords;

exports.addBreaks = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, breakdata, date } = req.body;

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        // console.log(startOfDay)

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // console.log(endOfDay)

        const existingBreak = await breakInfo.findOne({
            userId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingBreak) {
            if (breakdata.endTime) {
                const breakToUpdate = existingBreak.breaks.find(
                    b => {
                        if (breakdata.breakName === 'Others') {
                            return b.breakName === breakdata.breakName &&
                                b.reason === breakdata.reason &&
                                !b.endTime;
                        }
                        return b.breakName === breakdata.breakName && !b.endTime;
                    }
                );

                if (breakToUpdate) {
                    breakToUpdate.endTime = breakdata.endTime;
                } else {
                    existingBreak.breaks.push(breakdata);
                }
            } else {
                existingBreak.breaks.push(breakdata);
            }
            await existingBreak.save();
            return res.status(200).json({ message: "Break updated", breaks: existingBreak });
        } else {
            const newBreak = new breakInfo({
                name,
                userId,
                date,
                breaks: [breakdata]
            });
            await newBreak.save();
            console.log(newBreak)
            return res.status(200).json({ message: "Break saved", breaks: newBreak });
        }
    } catch (error) {
        console.error("Error saving break:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error saving break"
        });
    }
}

exports.getBreakByDate = async (req, res) => {
    try {
        const { userId, date } = req.params;
        // console.log("surys data")
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const breakRecord = await breakInfo.findOne({
            userId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        // console.log(breakRecord)
        return res.status(200).json({
            breaks: breakRecord
        });
    } catch (error) {
        console.error("Error getting breaks:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting breaks"
        });
    }
}
exports.getAllBreaks = async (req, res) => {
    try {
        const {userId} = req.params;
        let breaks = await breakInfo.find({userId});
        breaks = breaks.filter((data=>data.date.toString().slice(0, 11)!=new Date().toString().slice(0, 11)))
        // console.log(breaks)
        if(breaks.length==0){
            return res.status(400).json({message:"No breaks found"})
        }
       return res.status(200).json({message:"Data retrieved successfully", breaks: breaks.length >0 ? breaks[breaks.length-1]:0})

    } catch (error) {
        console.error("Error getting breaks:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting breaks"
        });
    }
}