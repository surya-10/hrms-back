const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
const moment = require("moment");
dotenv.config()

const userInfo = db.user;
const userSessionInfo = db.session;
const roleInfo = db.role;
const profileInfo = db.profile;
const professionInfo = db.profession;
const timeoffInfo = db.timeoffhistory;
const loginInInfo = db.loginHistory;
const workingDaysInfo = db.workingDays;
const breakDetails = db.breakRecords;
const permissionInfo = db.permissionRecords;
const leaveRecordInfo = db.employeeLeaveRecorder;

const checkApprovedLeave = async (userId, date) => {
    try {
        const timeoff = await timeoffInfo.findOne({ user_id: userId });
        if (!timeoff) return null;

        // Find any approved leave request for the given date
        const approvedLeave = timeoff.leave_requests.find(request => {
            if (request.status_name !== "Approved") return false;
            
            const leaveDate = new Date(request.leave_date[0].date);
            const checkDate = new Date(date);
            
            return leaveDate.getDate() === checkDate.getDate() &&
                   leaveDate.getMonth() === checkDate.getMonth() &&
                   leaveDate.getFullYear() === checkDate.getFullYear();
        });

        return approvedLeave;
    } catch (error) {
        console.error("Error checking approved leave:", error);
        return null;
    }
};

exports.createCheckIn = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime, type } = req.body;
        // console.log(type, date, startTime, "data ");
        if (type === "checkIn") {
            // let parsedDate = date.slice(0, 10)
            // console.log(parsedDate)
            // parsedDate=parsedDate.slice(0, 10)
            // if (!moment(date, "YYYY-MM-DD", true).isValid()) {
            //     return res.status(400).json({ message: "Invalid date format. Use 'YYYY-MM-DD'." });
            // }

            const parsedDate = new Date(date);
            const user = await userInfo.findOne({ _id: id, is_deleted: false }, { password: 0 });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check for approved leaves
            const approvedLeave = await checkApprovedLeave(id, date);
            if (approvedLeave) {
                if (!approvedLeave.is_half_day_leave) {
                    // Full day leave - no check-in allowed
                    return res.status(400).json({ message: "Cannot check-in on approved full-day leave" });
                } else {
                    // Half day leave - check timing
                    const isFirstHalf = approvedLeave.leave_date[0].start_date === "9 AM";
                    const currentHour = new Date().getHours();
                    
                    if (isFirstHalf && currentHour < 14) { // Before 2 PM
                        return res.status(400).json({ message: "Cannot check-in during approved first half leave" });
                    } else if (!isFirstHalf && currentHour >= 14) { // After 2 PM
                        return res.status(400).json({ message: "Cannot check-in during approved second half leave" });
                    }
                }
            }

            let attendanceRecord = await loginInInfo.findOne({ user_id: id });
            if (!attendanceRecord) {
                attendanceRecord = new loginInInfo({
                    userName: user.first_name,
                    user_id: id,
                    attendance: [
                        {
                            date: parsedDate,
                            logHistory: [{ startTime, type }]
                        }
                    ]
                });
                await attendanceRecord.save();
                const dateExists = attendanceRecord.attendance.find(
                    (entry) => entry.date.toISOString().split("T")[0] === parsedDate.toISOString().split("T")[0]
                );
                console.log(dateExists)
                return res.status(201).json({ message: "Check-in created successfully.", data:[dateExists] });
            }

            const dateExists = attendanceRecord.attendance.find(
                (entry) => entry.date.toISOString().split("T")[0] === parsedDate.toISOString().split("T")[0]
            );
            // console.log(dateExists)

            if (dateExists) {
                return res.status(400).json({ message: "Check-in already recorded for this date.", data: dateExists });
            }
            attendanceRecord.attendance.push({
                date: parsedDate,
                logHistory: [{ startTime, type }]
            });


            await attendanceRecord.save();
            const selectedDate = attendanceRecord.attendance.filter((data) => data.date.toString().slice(0, 12) == parsedDate.toString().slice(0, 12));
            // console.log(selectedDate)

            return res.status(200).json({ message: "Check-in created successfully.", data: selectedDate });
        }

        else if (type == "checkOut") {
            console.log(type, date, startTime, "data ");
            // if (!moment(date, "YYYY-MM-DD", true).isValid()) {
            //     return res.status(400).json({ message: "Invalid date format. Use 'YYYY-MM-DD'." });
            // }
            const parsedDate = new Date(date);
            const user = await userInfo.findOne({ _id: id, is_deleted: false }, { password: 0 });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            let attendanceRecord = await loginInInfo.findOne({ user_id: id });
            if (!attendanceRecord) {
                //     attendanceRecord = new loginInInfo({
                //         userName: user.first_name,
                //         user_id: id,
                //         attendance: [
                //             {
                //                 date: parsedDate,
                //                 logHistory: [{ endTime:startTime }]
                //             }
                //         ]
                //     });
                //     await attendanceRecord.save();
                return res.status(201).json({ message: "Check-in before checkout." });
            }
            const dateExists = attendanceRecord.attendance.find(
                (entry) => entry.date.toISOString().split("T")[0] === parsedDate.toISOString().split("T")[0]
            );
            if (dateExists) {
                const timeExists = dateExists.logHistory.some(log => log.endTime === startTime);
                // console.log(timeExists)
                if (timeExists) {
                    return res.status(400).json({ message: "Check-out already recorded for this time." });
                }
                dateExists.logHistory.push({ endTime: startTime, type });
            } else {
                return res.status(201).json({ message: "Check-in before checkouttt." });
                // attendanceRecord.attendance.push({
                //     date: parsedDate,
                //     logHistory: [{ endTime:startTime }]
                // });
            }
            await attendanceRecord.save();

            // Add this new code block after successful checkout
            if (dateExists) {
                try {
                    // First get the employee details
                    const employee = await userInfo.findById(id);
                    if (!employee) {
                        console.log("Employee not found:", id);
                        throw new Error("Employee not found");
                    }

                    // Then get the manager details
                    const manager = await userInfo.findById(employee.manager_id);
                    if (!manager) {
                        // console.log("Manager not found for employee:", id);
                        throw new Error("Manager information not available");
                    }

                    const checkInTime = dateExists.logHistory[0].startTime;
                    const checkOutTime = startTime;
                    const workingHours = calculateWorkingHours(checkInTime, checkOutTime);

                    // Get break details for the day
                    const breakDetail = await breakDetails.findOne({
                        userId: id,
                        date: {
                            $gte: new Date(date).setHours(0, 0, 0),
                            $lt: new Date(date).setHours(23, 59, 59)
                        }
                    });
                    // console.log(breakDetail)
                    const totalHours = calculateTotalBreakTime(breakDetail.breaks);


                    if (!process.env.email || !process.env.pass) {
                        throw new Error("Email configuration is missing");
                    }

                    // Create email transporter
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.email,
                            pass: process.env.pass
                        }
                    });

                    // Prepare email content with improved styling
                    const mailOptions = {
                        from: process.env.email,
                        to: manager.email,
                        subject: `Daily Work Report - ${employee.first_name} ${employee.last_name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Daily Work Report</h2>
                                
                                <div style="margin: 20px 0;">
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Employee:</strong> ${employee.first_name} ${employee.last_name}</p>
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                                </div>

                                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Check-in Time:</strong> ${checkInTime}</p>
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Check-out Time:</strong> ${checkOutTime}</p>
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Total Working Hours:</strong> <span style="color: #27ae60;">${workingHours}</span></p>
                                    <p style="margin: 10px 0;"><strong style="color: #2c3e50;">Total Break Time:</strong> <span style="color: #e74c3c;"> ${totalHours.hours}H ${totalHours.minutes}M</span></p>
                                </div>

                                <div style="font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center;">
                                    This is an automated report generated by the HRMS system.
                                </div>
                            </div>
                        `
                    };

                    // Send email
                    await transporter.sendMail(mailOptions);
                    console.log(`Email sent successfully to manager: ${manager.email}`);

                } catch (emailError) {
                    console.error("Error sending email:", emailError);
                    // Continue with the response even if email fails
                }
            }

            const selectedDate = attendanceRecord.attendance.filter((data) => data.date.toString().slice(0, 12) == parsedDate.toString().slice(0, 12));
            return res.status(200).json({ message: "Check-out updated successfully.", data: selectedDate });

        }

    } catch (error) {
        console.error("Error creating check-in:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error creating check-in"
        });
    }
};

function calculateWorkingHours(startTime, endTime) {
    const start = new Date(`2024-01-01 ${startTime}`);
    const end = new Date(`2024-01-01 ${endTime}`);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

exports.getAllCheckIn = async (req, res) => {
    try {
        const { managerId } = req.params;

        const user = await userInfo.findOne({ _id: managerId, is_deleted: false }, { password: 0 }).populate("role");
        if (!user || user.role?.role_value !== "manager") {
            return res.status(400).json({ message: "You are not a manager" });
        }
        const allUsers = await userInfo.find({ manager_id: managerId }, { password: 0 });
        const userIds = allUsers.map((data) => data._id);
        // console.log(userIds)

        if (userIds.length === 0) {
            return res.status(200).json({ message: "No data found" });
        }
        const attendanceData = await loginInInfo.find({
            user_id: { $in: userIds }
        });
        // console.log(attendanceData)

        return res.status(200).json({ message: "Data retrieved", data: attendanceData });

    } catch (error) {
        console.error("Error retrieving check-in:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error retrieving check-in"
        });
    }
};
exports.getAllCheckInAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        console.log(adminId)

        const user = await userInfo.findOne({ _id: adminId, is_deleted: false }, { password: 0 }).populate("role");
        if (!user || user.role?.role_value !== "admin") {
            return res.status(400).json({ message: "You are an Admin" });
        }
        const allUsers = await userInfo.find({}, { password: 0 });
        const userIds = allUsers.map((data) => data._id);
        console.log(userIds)

        if (userIds.length === 0) {
            return res.status(200).json({ message: "No data found" });
        }
        const attendanceData = await loginInInfo.find({
            user_id: { $in: userIds }
        });

        return res.status(200).json({ message: "Data retrieved", data: attendanceData });

    } catch (error) {
        console.error("Error retrieving check-in:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error retrieving check-in"
        });
    }
};
exports.getAllCheckInData = async (req, res) => {
    try {
        const { adminId } = req.params;
        console.log(adminId);

        const user = await userInfo.findOne({ _id: adminId, is_deleted: false }, { password: 0 }).populate("role");
        if (!user || user.role?.role_value !== "admin") {
            return res.status(400).json({ message: "You are an Admin" });
        }
        const allUsers = await userInfo.find({}, { password: 0 });
        const userIds = allUsers.map((data) => data._id);
        // console.log(userIds);

        if (userIds.length === 0) {
            return res.status(400).json({ message: "No data found" });
        }
        const data = new Date();
        const formattedDate = data.toISOString().split('T')[0];
        const formattedDateWithTime = `${formattedDate}T00:00:00.000+00:00`;


        console.log(formattedDateWithTime, "formattedDateWithTime", formattedDate);

        const attendanceData = await loginInInfo.find({
            user_id: { $in: userIds }
        });
        // console.log(attendanceData, "attendanceData")
        // console.log(attendanceData[0])
        const records = [];
        for (let i = 0; i < attendanceData.length; i++) {
            for (let j = 0; j < attendanceData[i].attendance.length; j++) {
                let appliedDate = attendanceData[i].attendance[j].date.toISOString().split("T")[0];

                if (appliedDate === formattedDate) {
                    records.push(attendanceData[i].attendance[j]);
                }
            }
        }
        // console.log(records.length, "records ")
        const allLeaves = await db.leaveRecords.find();
        // console.log(allLeaves)
        const allDates = [];
        for (let i = 0; i < allLeaves.length; i++) {
            for (let j = 0; j < allLeaves[i].date.length; j++) {
                // console.log(allLeaves[i].date[j])
                let todayDate = formattedDate.split("-").reverse().join("-");
                if (todayDate == allLeaves[i].date[j]) {
                    allDates.push(allLeaves[i].date[j]);
                }
            }
        }



        return res.status(200).json({ message: "Retrived", allLeaves, allDates, allUsers })



        // console.log(filteredAttendanceData, "filteredAttendanceData")
        // if (filteredAttendanceData.length === 0) {
        //     return res.status(400).json({ message: "No attendance found for the selected date" });
        // }

        // return res.status(200).json({ message: "Data retrieved", data: filteredAttendanceData });

    } catch (error) {
        console.error("Error retrieving check-in:", error);

        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error retrieving check-in"
        });
    }
};


exports.getByDate = async (req, res) => {
    const { id, date } = req.params;
    const newDate = new Date(date);

    try {
        let attendanceRecord = await loginInInfo.findOne({ user_id: id });
        if (!attendanceRecord) {
            return res.status(404).json({ message: "Login history not found" });

        }
        const dateExists = attendanceRecord.attendance.filter((data) => data.date.toString().slice(0, 12) == newDate.toString().slice(0, 12));
        if (dateExists.length == 0) {
            return res.status(404).json({ message: "Check-in not found for this date." });
        }

        return res.status(200).json({ data: dateExists })
    }
    catch (error) {
        console.error("Error getting check-in history:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting check-in history"
        });
    }
}
exports.getcheckInHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userInfo.findById(id, { password: 0 }).populate(["role"]);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        let attendanceRecord = await loginInInfo.findOne({ user_id: id });
        if (!attendanceRecord) {
            return res.status(200).json({ message: "Login history not found", ok:false });
        }
        const date = new Date().getMonth();
        const permissions = await permissionInfo.find();
        const findWorkingDays = await workingDaysInfo.find({}, { _id: 0, __v: 0 });
        const leaves = await leaveRecordInfo.find({ userId: id });
        // console.log(leaves.length, "leaves")
        // console.log(attendanceRecord)

        return res.status(200).json({ data: attendanceRecord.attendance, month: findWorkingDays, permissions, leaves, ok:true })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting login history"
        });
    }
}

exports.getAllAttendance = async (req, res) => {
    try {
        const attendanceRecord = await loginInInfo.find();
        if (!attendanceRecord) {
            return res.status(404).json({ message: "Login history not found" });
        }
        return res.status(200).json({ data: attendanceRecord })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting login history"
        });
    }
}

const calculateTotalBreakTime = (breaks) => {
    let totalDuration = 0;

    breaks.forEach(({ startTime, endTime }) => {
        if (endTime) {
            totalDuration += parseInt(endTime) - parseInt(startTime);
        }
    });

    // Convert total duration from milliseconds to hours & minutes
    const totalMinutes = Math.floor(totalDuration / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
}; 