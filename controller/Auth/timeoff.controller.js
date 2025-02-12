const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
const moment = require("moment");
const cron = require('node-cron');
dotenv.config()

const userInfo = db.user;
const userSessionInfo = db.session;
const roleInfo = db.role;
const profileInfo = db.profile;
const professionInfo = db.profession;
const timeoffInfo = db.timeoffhistory;
const attendanceInfo = db.attendance;
const attendenceHistoryInfo = db.attendenceHistory;
const leaveRecordInfo = db.employeeLeaveRecorder;
const employeeLeaveInfo = db.leaveRecords;
const permissionInfo = db.permissionRecords;

exports.createTimeoff = async (req, res) => {
    try {
        const { id } = req.params;
        const { leave_request, date } = req.body;
        console.log(leave_request, date, id)

        // Check permission count if this is a permission request
        if (leave_request.is_permission) {
            const currentDate = new Date();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            // Find the leave record for current month
            const leaveRecord = await leaveRecordInfo.findOne({
                userId: id,
                month: month,
                year: year
            });

            if (leaveRecord && leaveRecord.permission_count >= 2) {
                return res.status(400).send({
                    message: "Monthly permission limit (2) has been reached. Cannot raise more permissions this month."
                });
            }
        }

        leave_request.user_id = id;
        let user = await userInfo.findById(id, { password: 0 }).populate(["role", "profile_id", "profession_id"]);
        if (!user) {
            return res.status(400).send({ message: "User not found" });
        }
        const manager = await userInfo.findOne({ _id: user.manager_id }, { password: 0 });
        const managerEmail = manager.email
        let userTimeoff = await timeoffInfo.findOne({ user_id: id });

        leave_request.created_by = user._id;

        leave_request.approved_by = user.manager_id || null;

        leave_request.initialed_on = new Date();

        // let attendenceHistory = await attendanceInfo.find({ user_id: id })
        // let history = await attendenceHistoryInfo.find({ user_id: id })
        let timeoffData;
        if (userTimeoff == null) {
            if (leave_request.is_permission) {
                timeoffData = {
                    permission: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    },
                };
            }
            else if (leave_request.is_half_day_leave) {
                timeoffData = {
                    half_day_leave: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    }
                }
            }
            else {
                timeoffData = {
                    leave: {
                        no_of_days: leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        ),
                        comments: leave_request.comments,
                    },
                };
            }
            console.log(timeoffData, 69)

            if (leave_request.is_permission) {
                const currentMonth = moment(date).month() + 1;
                console.log(currentMonth)

                const permissionCount = await permissionInfo.countDocuments({ userId: user._id, month: currentMonth });

                if (permissionCount >= 2) {
                    return res.status(400).json({ message: 'You have already availed two permissions this month.' });
                }

                const permission = new permissionInfo({
                    userId: user._id,
                    month: currentMonth,
                    date, startTime: leave_request.leave_date[0].start_date,
                    endTime: leave_request.leave_date[0].end_date
                });
                await permission.save();

                leave_request.user_id = id
                let timeOff = new timeoffInfo({

                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    leave_requests: [leave_request]

                });
                // let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
                // console.log(month)
                // const attendanceHistoryData = new attendenceHistoryInfo({
                //     user_id: user._id,
                //     profile_id: user.profile_id._id,
                //     profession_id: user.profession_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     no_of_days: !leave_request.is_permission
                //         ? leave_request.leave_date.reduce(
                //             (totalDays, dateRange) =>
                //                 totalDays +
                //                 calculateDays(dateRange.start_date, dateRange.end_date),
                //             0
                //         )
                //         : 0,
                //     hour_count: leave_request.is_permission
                //         ? calculateHours(
                //             leave_request.leave_date[0].start_date,
                //             leave_request.leave_date[0].end_date
                //         )
                //         : 0,
                //     leave_type: leave_request.leave_type,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     leave_date: {
                //         start_date: leave_request.leave_date[0].start_date,
                //         end_date: leave_request.leave_date[0].end_date,
                //     },
                //     approval_status: [
                //         {
                //             status: "Pending",
                //             approved_by: user.manager_id,
                //             approved_on: "",
                //             approval_comments: "",
                //         },
                //     ],
                // });

                // leave_request.leave_date[0].start_date = date;

                // leave_request.leave_date[0].end_date = date;
                // const leaveHistory = new attendanceInfo({
                //     user_id: user._id,
                //     profession_id: user.profession_id._id,
                //     profile_id: user.profile_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     is_permission: leave_request.is_permission,
                //     is_leave: !leave_request.is_permission,
                //     timeoff: timeoffData,
                //     status: leave_request.status,
                // });

                // await attendanceHistoryData.save()




                await timeOff.save();
                // await leaveHistory.save();
                console.log("suryua")

                return sendEmail(res, timeOff, user, managerEmail, leave_request, manager)
            }
            else if (leave_request.is_half_day_leave) {
                leave_request.user_id = id
                let timeOff = new timeoffInfo({
                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,

                    leave_requests: [leave_request]
                    // is_half_day_leave:true

                });
                console.log(timeOff, 180)
                await timeOff.save()
                return sendEmail(res, timeOff, user, managerEmail, leave_request, manager)


                // let month = leave_request.is_half_day ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
                // const leaveHistory = new attendanceInfo({
                //     user_id: user._id,
                //     profession_id: user.profession_id._id,
                //     profile_id: user.profile_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     is_permission: leave_request.is_permission,
                //     is_leave: !leave_request.is_half_day,
                //     timeoff: timeoffData,
                //     status: leave_request.status,
                // });
                //  const attendanceHistoryData = new attendenceHistoryInfo({
                //     user_id: user._id,
                //     profile_id: user.profile_id._id,
                //     profession_id: user.profession_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     no_of_days: !leave_request.is_permission
                //         ? leave_request.leave_date.reduce(
                //             (totalDays, dateRange) =>
                //                 totalDays +
                //                 calculateDays(dateRange.start_date, dateRange.end_date),
                //             0
                //         )
                //         : 0,
                //     hour_count: leave_request.is_permission
                //         ? calculateHours(
                //             leave_request.leave_date[0].start_date,
                //             leave_request.leave_date[0].end_date
                //         )
                //         : 0,
                //     leave_type: leave_request.leave_type,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     leave_date: {
                //         start_date: leave_request.leave_date[0].start_date,
                //         end_date: leave_request.leave_date[0].end_date,
                //     },
                //     approval_status: [
                //         {
                //             status: "Pending",
                //             approved_by: null,
                //             approved_on: null,
                //             approval_comments: "",
                //         },
                //     ],
                // });
            }
            else {
                leave_request.user_id = id
                let timeOff = new timeoffInfo({
                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    leave_requests: [leave_request]
                });
                // await timeOff.save();
                // let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
                // const leaveHistory = new attendanceInfo({
                //     user_id: user._id,
                //     profession_id: user.profession_id._id,
                //     profile_id: user.profile_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     is_permission: leave_request.is_permission,
                //     is_leave: !leave_request.is_permission,
                //     timeoff: timeoffData,
                //     status: leave_request.status,
                // });
                // const attendanceHistoryData = new attendenceHistoryInfo({
                //     user_id: user._id,
                //     profile_id: user.profile_id._id,
                //     profession_id: user.profession_id._id,
                //     timeoff_history_id: timeOff._id,
                //     leave_request_id: timeOff.leave_requests[0]._id,
                //     no_of_days: !leave_request.is_permission
                //         ? leave_request.leave_date.reduce(
                //             (totalDays, dateRange) =>
                //                 totalDays +
                //                 calculateDays(dateRange.start_date, dateRange.end_date),
                //             0
                //         )
                //         : 0,
                //     hour_count: leave_request.is_permission
                //         ? calculateHours(
                //             leave_request.leave_date[0].start_date,
                //             leave_request.leave_date[0].end_date
                //         )
                //         : 0,
                //     leave_type: leave_request.leave_type,
                //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                //     leave_date: {
                //         start_date: leave_request.leave_date[0].start_date,
                //         end_date: leave_request.leave_date[0].end_date,
                //     },
                //     approval_status: [
                //         {
                //             status: "Pending",
                //             approved_by: null,
                //             approved_on: null,
                //             approval_comments: "",
                //         },
                //     ],
                // });
                // await attendanceHistoryData.save()

                await timeOff.save();
                // console.log(timeOff, "abc")
                // await leaveHistory.save();


                // return res.status(201).send({
                //     message: "Time-off created successfully",
                //     data: timeOff,
                //     leaveHistory
                // });

                // Remove leave count update from here since it should only happen on approval
                return sendEmail(res, timeOff, user, managerEmail, leave_request, manager);
            }
        }
        else {
            if (leave_request.is_permission) {
                timeoffData = {
                    permission: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    },
                };
            }
            else if (leave_request.is_half_day_leave) {
                timeoffData = {
                    half_day_leave: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    }
                }
            }
            else {
                timeoffData = {
                    leave: {
                        no_of_days: leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        ),
                        comments: leave_request.comments,
                    },
                };
            }
            let flag = false;
            if (leave_request.is_permission) {
                let allPermission = userTimeoff.leave_requests.filter((data) => data.is_permission == true);
                if (allPermission.length > 0) {
                    for (let i = 0; i < allPermission.length; i++) {
                        if (allPermission[i].leave_date[0].date == leave_request.leave_date[0].date ||
                            allPermission[i].leave_date[0].date == leave_request.leave_date[0].date) {
                            flag = true;
                            return res.status(400).send({ message: "Permission already raised for selected date" });
                        }
                    }
                }
            }
            //storing permission requests
            if (leave_request.is_permission) {
                const currentMonth = moment(date).month() + 1;
                //  console.log(currentMonth)

                const permissionCount = await permissionInfo.countDocuments({ userId: user._id, month: currentMonth });

                // if (permissionCount >= 2) {
                //     return res.status(400).json({ message: 'You have already availed two permissions this month.' });
                // }
                const count = await leaveRe

                const permission = new permissionInfo({
                    userId: user._id,
                    month: currentMonth,
                    date, startTime: leave_request.leave_date[0].start_date,
                    endTime: leave_request.leave_date[0].end_date
                });
                await permission.save();
            }
            else if (leave_request.is_half_day_leave) {
                // console.log("confirm half day")
                console.log(userTimeoff.leave_requests);
                let allHalfDay = userTimeoff.leave_requests.filter((data) => data.is_half_day_leave == true);
                // console.log(allHalfDay, "allHalfDay")
                if (allHalfDay.length > 0) {
                    for (let i = 0; i < allHalfDay.length; i++) {
                        if (allHalfDay[i].leave_date[0].date == leave_request.leave_date[0].date ||
                            allHalfDay[i].leave_date[0].date == leave_request.leave_date[0].date) {
                            flag = true;
                            return res.status(400).send({ message: "Half day leave already raised for selected date" });
                        }
                    }
                }
                
                    leave_request.user_id = id
                    userTimeoff.leave_requests.push(leave_request);
                    console.log(userTimeoff, "abc")
                    await userTimeoff.save();
              
                const timeOff = await timeoffInfo.find({ user_id: id });
                return sendEmailHalfDay(res, timeOff[0], user, managerEmail, leave_request, manager);
            }

            for (let i = 0; i < userTimeoff.leave_requests.length; i++) {
                const existingLeave = userTimeoff.leave_requests[i];
                const isPermission = leave_request.is_permission;
                const requestStartDate = isPermission ? date : leave_request.leave_date[0].start_date;
                const requestEndDate = isPermission ? date : leave_request.leave_date[0].end_date;
                // console.log(requestStartDate, requestEndDate)

                const existingStartDate = existingLeave.leave_date[0].start_date;
                const existingEndDate = existingLeave.leave_date[0].end_date;

                if (
                    existingStartDate === requestStartDate ||
                    existingEndDate === requestEndDate ||
                    existingStartDate === requestEndDate ||
                    existingEndDate === requestStartDate
                ) {
                    return res.status(400).send({
                        message: "Leave request already raised for selected dates",

                    });
                }
            }

            leave_request.user_id = id
            userTimeoff.leave_requests.push(leave_request);
            await userTimeoff.save();
            // let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
            // const newAttendenceHistory = new attendanceInfo({
            //     user_id: user._id,
            //     profession_id: user.profession_id._id,
            //     profile_id: user.profile_id._id,
            //     timeoff_history_id: userTimeoff._id,
            //     leave_request_id: userTimeoff.leave_requests[userTimeoff.leave_requests.length - 1]._id,
            //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
            //     is_permission: leave_request.is_permission,
            //     is_leave: !leave_request.is_permission,
            //     timeoff: timeoffData,
            //     status: leave_request.status,
            // })
            // const attendanceHistoryData = new attendenceHistoryInfo({
            //     user_id: user._id,
            //     profile_id: user.profile_id._id,
            //     profession_id: user.profession_id._id,
            //     timeoff_history_id: userTimeoff._id,
            //     leave_request_id: userTimeoff.leave_requests[userTimeoff.leave_requests.length - 1]._id,
            //     no_of_days: !leave_request.is_permission
            //         ? leave_request.leave_date.reduce(
            //             (totalDays, dateRange) =>
            //                 totalDays +
            //                 calculateDays(dateRange.start_date, dateRange.end_date),
            //             0
            //         )
            //         : 0,
            //     hour_count: leave_request.is_permission
            //         ? calculateHours(
            //             leave_request.leave_date[0].start_date,
            //             leave_request.leave_date[0].end_date
            //         )
            //         : 0,
            //     leave_type: leave_request.leave_type,
            //     month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
            //     leave_date: {
            //         start_date: leave_request.leave_date[0].start_date,
            //         end_date: leave_request.leave_date[0].end_date,
            //     },
            //     approval_status: [
            //         {
            //             status: "Pending",
            //             approved_by: null,
            //             approved_on: null,
            //             approval_comments: "",
            //         },
            //     ],
            // });
            // await attendanceHistoryData.save()
            // await newAttendenceHistory.save();
            console.log("Surya")

            // updating leave count to leaves collection
            if (!leave_request.is_permission) {
                // Remove leave count update from here since it should only happen on approval
                const timeOff = await timeoffInfo.find({ user_id: id });
                return sendEmail(res, timeOff[0], user, managerEmail, leave_request, manager);
            }


            const timeOff = await timeoffInfo.find({ user_id: id });

            return sendEmail(res, timeOff[0], user, managerEmail, leave_request, manager);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            status: 500,
            error: error?.message,
            message: "Error creating time-off",
        });
    }
};

exports.createTimeoffByAdmin = async (req, res) => {
    try {
        const { adminId, id } = req.params;
        console.log(adminId, id)
        const { leave_request, date } = req.body;
        const admin = await userInfo.findById(adminId, { password: 0 }).populate(["role"]);
        const user = await userInfo.findById(id, { password: 0 }).populate(["role"]);
        if (!admin || !user) {
            return res.status(400).send({ message: "User not found" });
        }
        if (admin.role.role_value !== "admin") {
            return res.status(400).json({ message: "You are not admin to create timeoff" })
        }
        let userTimeoff = await timeoffInfo.findOne({ user_id: id });

        leave_request.created_by = admin._id;

        leave_request.approved_by = admin._id || null;

        leave_request.initialed_on = new Date();

        let attendenceHistory = await attendanceInfo.find({ user_id: id })
        let history = await attendenceHistoryInfo.find({ user_id: id })
        let timeoffData;
        if (!userTimeoff && attendenceHistory.length == 0 && history.length == 0) {
            if (leave_request.is_permission) {
                timeoffData = {
                    permission: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    },
                };
            } else {
                timeoffData = {
                    leave: {
                        no_of_days: leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        ),
                        comments: leave_request.comments,
                    },
                };
            }

            if (leave_request.is_permission) {
                let timeOff = new timeoffInfo({

                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    leave_requests: [leave_request]

                });
                let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
                const attendanceHistoryData = new attendenceHistoryInfo({
                    user_id: user._id,
                    profile_id: user.profile_id._id,
                    profession_id: user.profession_id._id,
                    leave_request_id: timeOff.leave_requests[0]._id,
                    timeoff_history_id: timeOff._id,
                    no_of_days: !leave_request.is_permission
                        ? leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays +
                                calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        )
                        : 0,
                    hour_count: leave_request.is_permission
                        ? calculateHours(
                            leave_request.leave_date[0].start_date,
                            leave_request.leave_date[0].end_date
                        )
                        : 0,
                    leave_type: leave_request.leave_type,
                    month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                    leave_date: {
                        start_date: leave_request.leave_date[0].start_date,
                        end_date: leave_request.leave_date[0].end_date,
                    },
                    approval_status: [
                        {
                            status: "Pending",
                            approved_by: admin._id,
                            approved_on: "",
                            approval_comments: "",
                        },
                    ],
                });
                console.log(attendanceHistoryData, "hist")

                leave_request.leave_date[0].start_date = date;

                leave_request.leave_date[0].end_date = date;

                const leaveHistory = new attendanceInfo({
                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    timeoff_history_id: timeOff._id,
                    leave_request_id: timeOff.leave_requests[0]._id,
                    month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                    is_permission: leave_request.is_permission,
                    is_leave: !leave_request.is_permission,
                    timeoff: timeoffData,
                    status: leave_request.status,
                });

                await attendanceHistoryData.save()


                await timeOff.save();
                await leaveHistory.save();

                return res.status(201).send({
                    message: "Time-off created successfully",
                    data: timeOff,
                    leaveHistory
                });
            }
            else {
                let timeOff = new timeoffInfo({
                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    leave_requests: [leave_request]

                });
                let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
                const leaveHistory = new attendanceInfo({
                    user_id: user._id,
                    profession_id: user.profession_id._id,
                    profile_id: user.profile_id._id,
                    timeoff_history_id: timeOff._id,
                    leave_request_id: timeOff.leave_requests[0]._id,
                    month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                    is_permission: leave_request.is_permission,
                    is_leave: !leave_request.is_permission,
                    timeoff: timeoffData,
                    status: leave_request.status,
                });
                const attendanceHistoryData = new attendenceHistoryInfo({
                    user_id: user._id,
                    profile_id: user.profile_id._id,
                    profession_id: user.profession_id._id,
                    timeoff_history_id: timeOff._id,
                    leave_request_id: timeOff.leave_requests[0]._id,
                    no_of_days: !leave_request.is_permission
                        ? leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays +
                                calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        )
                        : 0,
                    hour_count: leave_request.is_permission
                        ? calculateHours(
                            leave_request.leave_date[0].start_date,
                            leave_request.leave_date[0].end_date
                        )
                        : 0,
                    leave_type: leave_request.leave_type,
                    month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                    leave_date: {
                        start_date: leave_request.leave_date[0].start_date,
                        end_date: leave_request.leave_date[0].end_date,
                    },
                    approval_status: [
                        {
                            status: "Approved",
                            approved_by: admin._id,
                            approved_on: new Date(),
                            approval_comments: "",
                        },
                    ],
                });
                console.log(attendanceHistoryData)
                await attendanceHistoryData.save()

                await timeOff.save();
                await leaveHistory.save();

                return res.status(201).send({
                    message: "Time-off created successfully",
                    data: timeOff,
                    leaveHistory
                });

            }
        }
        else {
            if (leave_request.is_permission) {
                timeoffData = {
                    permission: {
                        hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                        comments: leave_request.comments,
                        date: date
                    },
                };
            } else {
                timeoffData = {
                    leave: {
                        no_of_days: leave_request.leave_date.reduce(
                            (totalDays, dateRange) =>
                                totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                            0
                        ),
                        comments: leave_request.comments,
                    },
                };
            }
            let flag = false;
            for (let i = 0; i < userTimeoff.leave_requests.length; i++) {
                if (userTimeoff.leave_requests[i].leave_date[0].start_date === leave_request.leave_date[0].start_date ||
                    userTimeoff.leave_requests[i].leave_date[0].end_date === leave_request.leave_date[0].end_date ||
                    userTimeoff.leave_requests[i].leave_date[0].start_date === leave_request.leave_date[0].end_date ||
                    userTimeoff.leave_requests[i].leave_date[0].end_date === leave_request.leave_date[0].start_date
                ) {
                    flag = true;
                    return res.status(400).send({ message: "Leave request already raised for selected dates" });
                }
            }
            userTimeoff.leave_requests.push(leave_request);
            let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
            console.log(timeoffData)
            const newAttendenceHistory = new attendanceInfo({
                user_id: user._id,
                profession_id: user.profession_id._id,
                profile_id: user.profile_id._id,
                timeoff_history_id: userTimeoff._id,
                leave_request_id: userTimeoff.leave_requests[userTimeoff.leave_requests.length - 1]._id,
                month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                is_permission: leave_request.is_permission,
                is_leave: !leave_request.is_permission,
                timeoff: timeoffData,
                status: leave_request.status,
            })
            const attendanceHistoryData = new attendenceHistoryInfo({
                user_id: user._id,
                profile_id: user.profile_id._id,
                profession_id: user.profession_id._id,
                timeoff_history_id: userTimeoff._id,
                leave_request_id: userTimeoff.leave_requests[userTimeoff.leave_requests.length - 1]._id,
                no_of_days: !leave_request.is_permission
                    ? leave_request.leave_date.reduce(
                        (totalDays, dateRange) =>
                            totalDays +
                            calculateDays(dateRange.start_date, dateRange.end_date),
                        0
                    )
                    : 0,
                hour_count: leave_request.is_permission
                    ? calculateHours(
                        leave_request.leave_date[0].start_date,
                        leave_request.leave_date[0].end_date
                    )
                    : 0,
                leave_type: leave_request.leave_type,
                month_for: `${month.getMonth() + 1}-${month.getFullYear()}`,
                leave_date: {
                    start_date: leave_request.leave_date[0].start_date,
                    end_date: leave_request.leave_date[0].end_date,
                },
                approval_status: [
                    {
                        status: "Pending",
                        approved_by: admin._id,
                        approved_on: new Date(),
                        approval_comments: "",
                    },
                ],
            });
            console.log(attendanceHistoryData)
            await attendanceHistoryData.save()

            await userTimeoff.save();
            await newAttendenceHistory.save();
            return res.status(200).json({ message: "Timeoff submitted", userTimeoff, newAttendenceHistory })
        }

    } catch (error) {
        console.error(error);
        res.status(500).send({
            status: 500,
            error: error?.message,
            message: "Error creating time-off",
        });
    }
}
exports.editTimeoff = async (req, res) => {
    try {
        const { id, timeoffId } = req.params;
        let { leave_request, date } = req.body;
        let user = await userInfo.findById(id, { password: 0 });
        let timeoff = await timeoffInfo.findOne({ user_id: id });
        if (!user || !timeoff) {
            return res.status(400).send({ message: "not found" });
        }

        let index = timeoff.leave_requests.findIndex((data) => data._id == timeoffId);
        let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
        if (timeoff.leave_requests[index].status_name == "Approved" || timeoff.leave_requests[index].status_name == "Rejected") {
            return res.status(400).send({ message: `Your time off reqest already has been ${timeoff.leave_requests[index].status_name}` })
        }
        timeoff.leave_requests[index] = {
            ...timeoff.leave_requests[index]._doc,
            ...leave_request,
            initialed_on: new Date()
        };
        let attendenceHistory = await attendanceInfo.find({ user_id: id, leave_request_id: timeoff.leave_requests[index]._id })
        attendenceHistory[0].is_permission = leave_request.is_permission;
        attendenceHistory[0].is_leave = !leave_request.is_permission;
        attendenceHistory[0].month_for = `${month.getMonth() + 1}-${month.getFullYear()}`;
        let timeoffData;
        if (leave_request.is_permission) {
            timeoffData = {
                permission: {
                    hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                    comments: leave_request.comments,
                    date: date
                },
            };
        }
        else {
            timeoffData = {
                leave: {
                    no_of_days: leave_request.leave_date.reduce(
                        (totalDays, dateRange) =>
                            totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                        0
                    ),
                    comments: leave_request.comments,
                },
            };
        }
        attendenceHistory[0].timeoff = timeoffData;

        await attendenceHistory[0].save();
        let history = await attendenceHistoryInfo.find({ user_id: id, leave_request_id: timeoff.leave_requests[index]._id })
        history[0].leave_date = leave_request.leave_date[0];
        if (leave_request.is_permission) {
            history[0].no_of_days = 0;
            history[0].hour_count = calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date)
        } else {
            history[0].hour_count = 0;
            history[0].no_of_days = leave_request.leave_date.reduce(
                (totalDays, dateRange) =>
                    totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                0
            )
        }
        history[0].leave_type = leave_request.leave_type;
        history[0].month_for = `${month.getMonth() + 1}-${month.getFullYear()}`,
            await timeoff.save();
        await history[0].save();
        return res.status(200).send({ message: "Timeoff updated" })

    } catch (error) {
        console.error(error);
        res.status(500).send({
            status: 500,
            error: error?.message,
            message: "Error creating time-off",
        });
    }
}

exports.editTimeofffByHr = async (req, res) => {
    try {
        const { hr_id, user_id, timeoffId } = req.params;
        console.log(hr_id, user_id, timeoffId)
        const { leave_request, date } = req.body;
        const isHr = await userInfo.findById(hr_id, { password: 0 }).populate(["role"]);
        if (!isHr || isHr.role.role_value !== "hr") {
            return res.status(400).send({ message: "You dont have access to edit timeoff" });
        }
        const user = await userInfo.findById(user_id, { password: 0 }).populate(["role"]);
        if (!user) {
            return res.status(400).send({ message: "user not found" });
        }
        const timeoff = await timeoffInfo.findOne({ user_id });
        console.log(timeoff)
        if (!timeoff) {
            return res.status(400).send({ message: "Timeoff not found for selected user" });
        }
        let index = timeoff.leave_requests.findIndex((data) => data._id == timeoffId);
        let month = leave_request.is_permission ? new Date(date) : new Date(leave_request.leave_date[0].start_date);
        // if (timeoff.leave_requests[index].status_name == "Approved" || timeoff.leave_requests[index].status_name == "Rejected") {
        //     return res.status(400).send({ message: `Your time off reqest already has been ${timeoff.leave_requests[index].status_name}` })
        // }
        timeoff.leave_requests[index] = {
            ...timeoff.leave_requests[index]._doc,
            ...leave_request,
            initialed_on: new Date()
        };
        let attendenceHistory = await attendanceInfo.find({ user_id: user_id, leave_request_id: timeoff.leave_requests[index]._id })
        attendenceHistory[0].is_permission = leave_request.is_permission;
        attendenceHistory[0].is_leave = !leave_request.is_permission;
        attendenceHistory[0].month_for = `${month.getMonth() + 1}-${month.getFullYear()}`;
        let timeoffData;
        if (leave_request.is_permission) {
            timeoffData = {
                permission: {
                    hour_count: calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date),
                    comments: leave_request.comments,
                    date: date
                },
            };
        }
        else {
            timeoffData = {
                leave: {
                    no_of_days: leave_request.leave_date.reduce(
                        (totalDays, dateRange) =>
                            totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                        0
                    ),
                    comments: leave_request.comments,
                },
            };
        }
        attendenceHistory[0].timeoff = timeoffData;

        await attendenceHistory[0].save();
        let history = await attendenceHistoryInfo.find({ user_id: user_id, leave_request_id: timeoff.leave_requests[index]._id })
        history[0].leave_date = leave_request.leave_date[0];
        if (leave_request.is_permission) {
            history[0].no_of_days = 0;
            history[0].hour_count = calculateHours(leave_request.leave_date[0].start_date, leave_request.leave_date[0].end_date)
        } else {
            history[0].hour_count = 0;
            history[0].no_of_days = leave_request.leave_date.reduce(
                (totalDays, dateRange) =>
                    totalDays + calculateDays(dateRange.start_date, dateRange.end_date),
                0
            )
        }
        history[0].leave_type = leave_request.leave_type;
        history[0].month_for = `${month.getMonth() + 1}-${month.getFullYear()}`,
            await timeoff.save();
        await history[0].save();
        return res.status(200).send({ message: "Timeoff updated" })
    } catch (error) {
        console.error(error);
        res.status(500).send({
            status: 500,
            error: error?.message,
            message: "Error creating time-off",
        });
    }
}

const updateTimeoffStatus = async (req, res, status) => {
    try {
        const { id, timeoffId, managerId } = req.params;
        const { approvalComments } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(timeoffId) ||
            !mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }

        const user = await userInfo.findById(id);
        if (!user) return res.status(404).send({ message: "User not found" });

        if (user.manager_id.toString() !== managerId) {
            return res.status(403).send({ message: "Unauthorized manager" });
        }

        const timeoff = await timeoffInfo.findOne({ user_id: id });
        if (!timeoff) return res.status(404).send({ message: "Time-off data not found" });

        const index = timeoff.leave_requests.findIndex((data) => data._id.toString() === timeoffId);
        if (index === -1) {
            return res.status(404).send({ message: "Time-off request not found" });
        }

        timeoff.leave_requests[index].status_name = status;
        timeoff.leave_requests[index].approval_comments = approvalComments;

        if (status === "Approved") {
            // Parse dates safely
            const currentDate = new Date();
            let start = currentDate;
            let end = currentDate;

            try {
                const startDate = timeoff.leave_requests[index].leave_date[0].start_date;
                const endDate = timeoff.leave_requests[index].leave_date[0].end_date;
                
                // Try to parse the dates
                const parsedStart = new Date(startDate);
                const parsedEnd = new Date(endDate);
                
                // Only use parsed dates if they are valid
                if (!isNaN(parsedStart.getTime())) {
                    start = parsedStart;
                }
                if (!isNaN(parsedEnd.getTime())) {
                    end = parsedEnd;
                }
            } catch (error) {
                console.error("Error parsing dates:", error);
            }

            const month = start.getMonth() + 1;
            const year = start.getFullYear(); // This will now always be a valid number

            // Get existing leave record for the month
            let leaveRecord = await leaveRecordInfo.findOne({ 
                userId: id,
                month: month,
                year: year
            });

            if (!leaveRecord) {
                leaveRecord = new leaveRecordInfo({
                    userId: id,
                    month: month,
                    year: year,
                    total_leave_taken: 0,
                    total_loss_of_pay: 0,
                    half_days_taken: 0
                });
            }

            if (timeoff.leave_requests[index].is_half_day_leave) {
                // Handle half day leave
                leaveRecord.half_days_taken += 1;
                leaveRecord.total_leave_taken += 0.5;
                
                // If more than 2 half days in a month, count as LOP
                if (leaveRecord.half_days_taken > 2) {
                    leaveRecord.total_loss_of_pay += 0.5;
                }
            } else if (timeoff.leave_requests[index].is_permission) {
                // Handle permission
                leaveRecord.permission_count += 1;
            } else if (!timeoff.leave_requests[index].is_permission) {
                // Handle full day leave
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                if (days <= 0) {
                    return res.status(400).json({ message: "Invalid leave duration" });
                }

                // First day of month is free, rest are LOP
                leaveRecord.total_leave_taken += days;
                if (leaveRecord.total_leave_taken > 1) {
                    leaveRecord.total_loss_of_pay = leaveRecord.total_leave_taken - 1;
                }
            }

            await leaveRecord.save();
            await timeoff.save();

            const manager = await userInfo.findById(managerId);
            const email = manager.email;
            return triggerEmail(user, {
                ...timeoff.leave_requests[index].toObject(),
                total_leave_taken: leaveRecord.total_leave_taken,
                total_loss_of_pay: leaveRecord.total_loss_of_pay,
                half_days_taken: leaveRecord.half_days_taken,
                permission_count: leaveRecord.permission_count
            }, email, res, approvalComments);
        }

        await timeoff.save();
        const manager = await userInfo.findById(managerId);
        const email = manager.email;
        return triggerEmail(user, timeoff.leave_requests[index], email, res, approvalComments);
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            error: error.message || "Internal Server Error",
            message: `Error ${status.toLowerCase()} time-off`,
        });
    }
};
exports.updateTimeoffStatusByEmail = async (req, res) => {
    try {
        const { id, timeoffId, managerId } = req.params;
        const { approvalComments } = req.body;
        const status = "Approved";
        
        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(timeoffId) ||
            !mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }

        const user = await userInfo.findById(id);
        if (!user) return res.status(404).send({ message: "User not found" });

        const timeoff = await timeoffInfo.findOne({ user_id: id });
        if (!timeoff) return res.status(404).send({ message: "Time-off data not found" });

        const index = timeoff.leave_requests.findIndex((data) => data._id.toString() === timeoffId);
        if (index === -1) {
            return res.status(404).send({ message: "Time-off request not found" });
        }

        if (timeoff.leave_requests[index].status_name === "Approved") {
            return res.status(200).json({ message: "Timeoff request has been already approved" });
        } else if (timeoff.leave_requests[index].status_name === "Rejected") {
            return res.status(200).json({ message: "Timeoff request has been already rejected" });
        }

        timeoff.leave_requests[index].status_name = status;
        timeoff.leave_requests[index].approval_comments = approvalComments;

        // Parse dates safely
        const currentDate = new Date();
        let start = currentDate;
        let end = currentDate;

        try {
            const startDate = timeoff.leave_requests[index].leave_date[0].start_date;
            const endDate = timeoff.leave_requests[index].leave_date[0].end_date;
            
            // Try to parse the dates
            const parsedStart = new Date(startDate);
            const parsedEnd = new Date(endDate);
            
            // Only use parsed dates if they are valid
            if (!isNaN(parsedStart.getTime())) {
                start = parsedStart;
            }
            if (!isNaN(parsedEnd.getTime())) {
                end = parsedEnd;
            }
        } catch (error) {
            console.error("Error parsing dates:", error);
        }

        const month = start.getMonth() + 1;
        const year = start.getFullYear(); // This will now always be a valid number

        // Get existing leave record for the month
        let leaveRecord = await leaveRecordInfo.findOne({ 
            userId: id,
            month: month,
            year: year
        });

        if (!leaveRecord) {
            leaveRecord = new leaveRecordInfo({
                userId: id,
                month: month,
                year: year,
                total_leave_taken: 0,
                total_loss_of_pay: 0,
                half_days_taken: 0
            });
        }

        if (timeoff.leave_requests[index].is_half_day_leave) {
            // Handle half day leave
            leaveRecord.half_days_taken += 1;
            leaveRecord.total_leave_taken += 0.5;
            
            // If more than 2 half days in a month, count as LOP
            if (leaveRecord.half_days_taken > 2) {
                leaveRecord.total_loss_of_pay += 0.5;
            }
        } else if (timeoff.leave_requests[index].is_permission) {
            // Handle permission
            leaveRecord.permission_count += 1;
        } else if (!timeoff.leave_requests[index].is_permission) {
            // Handle full day leave
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            if (days <= 0) {
                return res.status(400).json({ message: "Invalid leave duration" });
            }

            // First day of month is free, rest are LOP
            leaveRecord.total_leave_taken += days;
            if (leaveRecord.total_leave_taken > 1) {
                leaveRecord.total_loss_of_pay = leaveRecord.total_leave_taken - 1;
            }
        }

        await leaveRecord.save();
        await timeoff.save();

        const manager = await userInfo.findById(managerId);
        const email = manager.email;

        return triggerEmail(user, {
            ...timeoff.leave_requests[index].toObject(),
            total_leave_taken: leaveRecord.total_leave_taken,
            total_loss_of_pay: leaveRecord.total_loss_of_pay,
            half_days_taken: leaveRecord.half_days_taken,
            permission_count: leaveRecord.permission_count
        }, email, res, approvalComments);

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            error: error.message || "Internal Server Error",
            message: "Error updating time-off status",
        });
    }
};
exports.updateTimeoffStatusByEmailReject = async (req, res) => {
    try {
        const { id, timeoffId, managerId } = req.params;
        console.log(id, timeoffId, managerId, 873)
        const { approvalComments } = req.body;
        const status = "Rejected";
        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(timeoffId) ||
            !mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }

        const user = await userInfo.findById(timeoffId);
        if (!user) return res.status(404).send({ message: "User not found" });


        const timeoff = await timeoffInfo.findOne({ user_id: timeoffId });
        if (!timeoff) return res.status(404).send({ message: "Time-off data not found" });

        const index = timeoff.leave_requests.findIndex((data) => data._id.toString() === id);
        if (index === -1) {
            return res.status(404).send({ message: "Time-off request not found" });
        }
        if (timeoff.leave_requests[index].status_name == "Approved") {
            return res.status(200).json({ message: "Timeoff request has been already approved" })
        }
        else if (timeoff.leave_requests[index].status_name == "Rejected") {
            return res.status(200).json({ message: "Timeoff request has been already rejected" })
        }
        timeoff.leave_requests[index].status_name = status;
        timeoff.leave_requests[index].approval_comments = approvalComments
        await timeoff.save();

        // return res.status(200).send({ message: `Time-off has been ${status}` });
        const manager = await userInfo.findById(managerId);
        const email = manager.email
        return triggerEmail(user, timeoff.leave_requests[index], email, res, approvalComments);
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            error: error.message || "Internal Server Error",
            message: `time-off`,
        });
    }
};

exports.approveTimeoff = (req, res) => {
    return updateTimeoffStatus(req, res, "Approved");
};
exports.rejectTimeoff = (req, res) => {
    return updateTimeoffStatus(req, res, "Rejected");
};

exports.viewTimeoff = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userInfo.findById(id, { password: 0 }).populate("role");
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        let timeoffRequests = [];
        const timeoffs = await timeoffInfo.find();
        if (user.role.role_name === "HR" || user.role.role_name === "Admin") {
            timeoffRequests = timeoffs.flatMap((data) => data.leave_requests);
        }
        else if (user.role.role_name == "Manager") {
            let usersWithManager = await userInfo.find({ manager_id: id }, { password: 0 });
            if (!usersWithManager) {
                return res.status(200).send({ message: "No leave requests raised" })
            }
            timeoffRequests = timeoffs.flatMap((data) => data.leave_requests.filter((leave) => {
                if (leave.approved_by == id) {
                    return leave['userId'] = data.user_id
                }
            }));

        } else {
            const userTimeoff = await timeoffInfo.findOne({ user_id: id });
            if (userTimeoff) {
                timeoffRequests = userTimeoff.leave_requests;

            }
        }
        return res.status(200).json({
            message: "Time-off requests retrieved successfully",
            data: timeoffRequests,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            error: error.message || "Internal Server Error",
            message: "Error retrieving time-off details",
        });
    }
};


const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};
function calculateHours(startTime, endTime) {

    const start = new Date(`1970-01-01T${convertTo24HourFormat(startTime)}:00Z`);
    const end = new Date(`1970-01-01T${convertTo24HourFormat(endTime)}:00Z`);
    const differenceInMilliseconds = end - start;
    const hours = differenceInMilliseconds / (1000 * 60 * 60);
    let actHour = hours >= 0 ? hours : 24 + hours;
    return hours >= 0 ? hours : 24 + hours;
}
function convertTo24HourFormat(time) {
    const [hour, modifier] = time.split(" ");
    let hours = parseInt(hour, 10);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    } else if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    return hours.toString().padStart(2, "0") + ":00";
}

const sendEmail = async (res, timeoff, user, email, leave_request, manager) => {
    const createdRequest = timeoff.leave_requests[timeoff.leave_requests.length - 1];
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });

    const mailOptions = {
        from: process.env.email,
        to: "sp659151@gmail.com",
        cc: user.email,
        subject: leave_request.is_permission ? "Permission Request" + "-" + leave_request.leave_date[0].start_date + "-" + leave_request.leave_date[0].end_date + "-" + leave_request.leave_date[0].date
            : "New Leave Request" + "-" + leave_request.leave_date[0].start_date + "-" + leave_request.leave_date[0].end_date + "-" + user.first_name,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                    }
                    .header {
                        background-color: #1a73e8;
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 0 0 8px 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .details {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                    }
                    .detail-row {
                        display: flex;
                        margin: 10px 0;
                        padding: 5px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 120px;
                        color: #666;
                    }
                    .detail-value {
                        flex: 1;
                        color: #333;
                    }
                    .button-container {
                        margin: 25px 0;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin: 0 10px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        text-align: center;
                    }
                    .approve-btn {
                        background-color: #28a745;
                        color: white;
                    }
                    .reject-btn {
                        background-color: #dc3545;
                        color: white;
                    }
                    .dashboard-btn {
                        background-color: #1a73e8;
                        color: white;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin: 0;">${leave_request.is_permission ? 'New Permission Request' : 'New Leave Request'}</h2>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>A new ${leave_request.is_permission ? 'permission' : 'leave'} request has been submitted. Please review the details below:</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Employee:</span>
                                <span class="detail-value">${user.first_name} ${user.last_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">From:</span>
                                <span class="detail-value">${leave_request.leave_date[0].start_date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">To:</span>
                                <span class="detail-value">${leave_request.leave_date[0].end_date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Reason:</span>
                                <span class="detail-value">${leave_request.comments}</span>
                            </div>
                        </div>

                        <div class="button-container">
                            <a href="http://localhost:5173/approve-leave/${user._id}/${createdRequest._id}/${manager._id}?action=approve" 
                               class="button approve-btn"  style="color:white;">
                                Approve
                            </a>
                            <a href="http://localhost:5173/approve-leave/${createdRequest._id}/${user._id}/${manager._id}?action=reject" 
                               class="button reject-btn"  style="color:white;">
                                Reject
                            </a>
                        </div>
                        
                        <div class="button-container">
                            <a href="http://localhost:5173/manager/view-records" 
                               class="button dashboard-btn"  style="color:white;">
                                Go to Dashboard
                            </a>
                        </div>

                        <div class="footer">
                            <p>Best Regards,<br>Your HR Team</p>
                            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply directly to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            return res.status(201).send({
                message: "Time-off created successfully",
                data: timeoff
            });
        }
    });
};

const sendEmailHalfDay = async (res, timeoff, user, email, leave_request, manager) => {
    const createdRequest = timeoff.leave_requests[timeoff.leave_requests.length - 1];
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });

    const mailOptions = {
        from: process.env.email,
        to: email,
        cc: user.email,
        subject: "New Half-day Request" + "-" + leave_request.leave_date[0].start_date + "-" + leave_request.leave_date[0].end_date + "-" + user.first_name,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                    }
                    .header {
                        background-color: #6b46c1;
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 0 0 8px 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .details {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                    }
                    .detail-row {
                        display: flex;
                        margin: 10px 0;
                        padding: 5px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 120px;
                        color: #666;
                    }
                    .detail-value {
                        flex: 1;
                        color: #333;
                    }
                    .button-container {
                        margin: 25px 0;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin: 0 10px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        text-align: center;
                    }
                    .approve-btn {
                        background-color: #28a745;
                        color: white;
                    }
                    .reject-btn {
                        background-color: #dc3545;
                        color: white;
                    }
                    .dashboard-btn {
                        background-color: #6b46c1;
                        color: white;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin: 0;">New Half-Day Leave Request</h2>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>A new half-day leave request has been submitted. Please review the details below:</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Employee:</span>
                                <span class="detail-value">${user.first_name} ${user.last_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${leave_request.leave_date[0].date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${leave_request.leave_date[0].start_date == "9 AM" ? "First half" : "Second half"}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Reason:</span>
                                <span class="detail-value">${leave_request.comments}</span>
                            </div>
                        </div>

                        <div class="button-container" >
                            <a href="http://localhost:5173/approve-leave/${user._id}/${createdRequest._id}/${manager._id}?action=approve" 
                               class="button approve-btn" style="color:white;">
                                Approve
                            </a>
                            <a href="http://localhost:5173/approve-leave/${createdRequest._id}/${user._id}/${manager._id}?action=reject" 
                               class="button reject-btn" style="color:white;">
                                Reject
                            </a>
                        </div>
                        
                        <div class="button-container">
                            <a href="http://localhost:5173/manager/view-records" 
                               class="button dashboard-btn" style="color:white;">
                                Go to Dashboard
                            </a>
                        </div>

                        <div class="footer">
                            <p>Best Regards,<br>Your HR Team</p>
                            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply directly to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            return res.status(201).send({
                message: "Time-off created successfully",
                data: timeoff
            });
        }
    });
};

const triggerEmail = (user, data, email, res, comments) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });
    const mailOptions = {
        from: process.env.email,
        to: email,
        cc: user.email,
        subject: data.is_permission ? "Permission Request" + " - " + data.status_name + "-" + user.first_name + "-" + data.leave_date[0].start_date + " to " + data.leave_date[0].end_date + " Date-" + data.leave_date[0].date :
            data.is_half_day_leave ? "Half day request" + "-" + data.status_name + "-" + user.first_name :
                "Leave request" + " - " + data.status_name + "-" + user.first_name + "-" + data.leave_date[0].start_date + "/" + data.leave_date[0].end_date,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                    }
                    .header {
                        background-color: ${data.status_name === "Approved" ? "#28a745" : "#dc3545"};
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 0 0 8px 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .details {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                    }
                    .detail-row {
                        display: flex;
                        margin: 10px 0;
                        padding: 5px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 180px;
                        color: #666;
                    }
                    .detail-value {
                        flex: 1;
                        color: #333;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        color: white;
                        background-color: ${data.status_name === "Approved" ? "#28a745" : "#dc3545"};
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin: 0;">Leave Request ${data.status_name}</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${user.first_name},</p>
                        <p>Your ${data.is_permission ? 'permission' : data.is_half_day_leave ? 'half-day leave' : 'leave'} request has been <span class="status-badge">${data.status_name}</span></p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Employee:</span>
                                <span class="detail-value">${user.first_name} ${user.last_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">From:</span>
                                <span class="detail-value">${data.leave_date[0].start_date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">To:</span>
                                <span class="detail-value">${data.leave_date[0].end_date}</span>
                            </div>
                            ${data.status_name === "Approved" ? `
                            <div class="detail-row">
                                <span class="detail-label">Total Leaves This Month:</span>
                                <span class="detail-value">${data.total_leave_taken || 0} day(s)</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Half Days This Month:</span>
                                <span class="detail-value">${data.half_days_taken || 0}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Loss of Pay:</span>
                                <span class="detail-value">${data.total_loss_of_pay || 0} day(s)</span>
                            </div>
                            ` : ''}
                            ${comments !== "Approved" ? `
                            <div class="detail-row">
                                <span class="detail-label">Comments:</span>
                                <span class="detail-value">${data.approval_comments}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            <p>Best Regards,<br>Your HR Team</p>
                            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply directly to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).send({ message: "Failed to send email" });
        }
        console.log("Email sent:", info.response);
        return res.status(200).send({ 
            message: "Notified User",
            total_leave_taken: data.total_leave_taken,
            total_loss_of_pay: data.total_loss_of_pay,
            half_days_taken: data.half_days_taken
        });
    });
};


const getDatesBetween = (start_date, end_date) => {
    let start = moment(start_date, "YYYY-MM-DD");
    let end = moment(end_date, "YYYY-MM-DD");
    let dates = [];

    while (start <= end) {
        dates.push(start.format("DD-MM-YYYY"));
        start.add(1, "day");
    }

    return dates;
};

exports.getMonthlyLeaves = async (req, res) => {
    try {
        const { id, month, year } = req.params;
        console.log(parseInt(month), 1496, id, year)
        
        const leaveRecords = await leaveRecordInfo.findOne({ 
            userId: id,
            month: parseInt(month),
            year: parseInt(year)
        }, {_id:0, __v:0, userId:0});
        console.log(leaveRecords, 1503)

        if (!leaveRecords) {
            console.log("data")
            return res.status(200).json({
                total_leave_taken: 0,
                total_loss_of_pay: 0,
                half_days_taken: 0
            });
        }

        return res.status(200).json(leaveRecords);
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            error: error.message || "Internal Server Error",
            message: "Error retrieving monthly leave records",
        });
    }
};

const sendPendingLeaveNotifications = async () => {
    try {
        // Find all timeoff requests with pending status
        const pendingRequests = await timeoffInfo.aggregate([
            {
                $unwind: "$leave_requests"
            },
            {
                $match: {
                    "leave_requests.status_name": "Requested"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "employee.manager_id",
                    foreignField: "_id",
                    as: "manager"
                }
            },
            {
                $group: {
                    _id: "$manager._id",
                    managerEmail: { $first: "$manager.email" },
                    managerName: { $first: "$manager.first_name" },
                    pendingRequests: {
                        $push: {
                            employeeName: { $first: "$employee.first_name" },
                            leaveDate: "$leave_requests.leave_date",
                            leaveType: {
                                $cond: [
                                    "$leave_requests.is_half_day_leave",
                                    "Half Day",
                                    {
                                        $cond: [
                                            "$leave_requests.is_permission",
                                            "Permission",
                                            "Full Day"
                                        ]
                                    }
                                ]
                            },
                            requestDate: "$leave_requests.created_at",
                            comments: "$leave_requests.comments",
                            requestId: "$leave_requests._id",
                            employeeId: "$user_id"
                        }
                    }
                }
            }
        ]);

        if (!pendingRequests.length) {
            console.log("No pending leave requests found");
            return;
        }

        // Email configuration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.pass
            }
        });

        // Send emails to each manager
        for (const managerData of pendingRequests) {
            if (!managerData.managerEmail) continue;

            const pendingRequestsHTML = managerData.pendingRequests.map(request => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${request.employeeName}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(request.leaveDate[0].start_date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${request.leaveType}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${request.comments}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                        <a href="${process.env.FRONTEND_URL}/approve-leave/${request.employeeId}/${request.requestId}/${managerData._id}?action=approve"
                           style="background-color: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; margin-right: 5px;">
                           Approve
                        </a>
                        <a href="${process.env.FRONTEND_URL}/approve-leave/${request.employeeId}/${request.requestId}/${managerData._id}?action=reject"
                           style="background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">
                           Reject
                        </a>
                    </td>
                </tr>
            `).join('');

            const mailOptions = {
                from: process.env.email,
                to: managerData.managerEmail,
                subject: 'Pending Leave Requests - Action Required',
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h2>Pending Leave Requests</h2>
                        <p>Hello ${managerData.managerName},</p>
                        <p>You have the following leave requests pending for approval:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 8px; border: 1px solid #ddd;">Employee</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Leave Date</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Type</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Comments</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingRequestsHTML}
                            </tbody>
                        </table>
                        
                        <p style="margin-top: 20px;">Please review and take appropriate action on these requests.</p>
                        <p>Best regards,<br>HR Team</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Notification sent to manager: ${managerData.managerEmail}`);
        }

    } catch (error) {
        console.error('Error sending pending leave notifications:', error);
    }
};
cron.schedule('30 10 * * *', () => {
    console.log('Running pending leave notifications cron job at 10:30 AM');
    sendPendingLeaveNotifications();
});
exports.sendPendingLeaveNotifications = sendPendingLeaveNotifications;