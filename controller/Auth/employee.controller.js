const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");

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

exports.createEmployee = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role, manager_id } = req.body;
        console.log(req.body, "req.body")
        let { user_id } = req.params;
        let isHr = await userInfo.findById(user_id).populate(["role"]);
        if (!isHr || isHr?.role?.role_value !== "admin") {
            return res.status(400).send({ message: "You are not a HR to create employee" })
        }
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
                message: "Employee already created",
            });
        }

        const newUser = new userInfo({
            first_name,
            last_name,
            email,
            phone,
            password,
            role: userRole,
            manager_id: manager_id ? manager_id : null,
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
            professionInfo:addProfession,
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
exports.deleteEmployee = async (req, res) => {
    try {
        const { id, hr_id } = req.params;
        if (!id || !hr_id) return res.status(403).send({ message: "Unauthorized access. No employee id or HR id" })
        let isHr = await userInfo.findById(hr_id).populate(["role"]);
        console.log(isHr, "isHr")
        if (isHr?.role?.role_value !== "hr") {
            return res.status(400).send({ message: "You don't have access to delete employee" })
        }
        const user = await userInfo.findOne({ $and: [{ _id: id }, { is_deleted: false }] });
        if (!user) {
            return res.status(200).send({
                message: "Something went wrong while deleting the users or user already deleted",
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
            message: "Could not delete User with id= ", id
        });
    }
};

exports.changeEmployeeStatus = async (req, res) => {
    try {
        const { id, hr_id } = req.params;
        const { status } = req.body;
        if (!id || !hr_id) return res.status(403).send({ message: "Unauthorized access. No employee id or HR id provided" })
        let isHr = await userInfo.findById(hr_id).populate(["role"]);
        if (isHr?.role?.role_value !== "hr") {
            return res.status(400).send({ message: "You don't have access to delete employee" })
        }
        const user = await userInfo.findById(id);
        console.log(user, "users ")
        if (!user) {
            return res.status(200).send({
                message: "Something went wrong while deleting the users or user already deleted",
            });
        }
        user.is_deleted = status;
        user.status = true
        await user.save();
        return res.status(200).send({ mesaage: "employee status updated" });
    } catch (error) {
        res.status(500).send({
            message: "Could not change the status of the employee ",
            error
        });
    }
}
exports.getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        let user = await userInfo.findById(id, { password: 0 }).populate(["role", "profession_id", "profile_id"]);
        if (!user) return res.status(400).send({
            message: "not found user",
        });
        return res.status(200).send({
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            message: "Could not get employee details ",
            error
        });
    }
}
exports.getAllEmployees = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id, 204)
        let users = await userInfo.findById(id).populate(["role", "profession_id", "profile_id"]);
        console.log(206,  users)
        if (!users) return res.status(400).send({
            message: "not found user",
        });

        let employees = [];
        if (users?.role?.role_value == "admin") {
            let allEmp = await userInfo.find({}, { password: 0 }).populate(["role", "profession_id", "profile_id"]);
            employees = allEmp;
        }
        else if (users?.role?.role_value == "hr") {
            employees = await userInfo.find({}, { password: 0 }).populate(["role", "profession_id", "profile_id"]);
        }
        else if (users?.role?.role_value == "manager") {
            employees = await userInfo.find({ manager_id: id }, { password: 0 }).populate(["role", "profession_id", "profile_id"]);
        }
        // if (users?.role?.role_value !== "hr" && users?.role?.role_value !== "manager") {
        //     return res.status(403).send({ mesaage: "Not authorized user to see employees" });
        // }

        return res.status(200).send({
            data: employees.length > 0 ? employees : [],
        });

    } catch (error) {
        res.status(500).send({
            message: "Could not get employees details ",
            error
        });
    }
}
exports.updateEmployeeDetailsByHr = async (req, res) => {
    try {
        let { id, hr_id } = req.params;
        let isHr = await userInfo.findById(hr_id).populate(["role"]);
        // if (isHr?.role?.role_value !== "hr") {
        //     return res.status(400).send({ message: "You don't have access to delete employee" })
        // }
        let user = await userInfo.findById(id).populate(["profile_id"]);
        if (!user) {
            return res.status(400).send({ mesaage: "User not found" })
        }
        let { date_of_birth, gender, joining_date, marital_status, nationality } = req.body;
        let updateUser = await profileInfo.findByIdAndUpdate(user.profile_id._id, { date_of_birth, gender, joining_date, marital_status, nationality });
        if (updateUser.status) {
            return res.status(200).json({ mesaage: "Employee details updated successfully" })
        }

    } catch (error) {
        res.status(500).send({
            message: "Could not update employee details ",
            error
        });
    }
}
exports.updateEmployeeDetails = async (req, res) => {
    try {
        let { id, hr_id } = req.params;
        let isHr = await userInfo.findById(hr_id).populate(["role"]);
        // if (isHr?.role?.role_value !== "hr") {
        //     return res.status(400).send({ message: "You don't have access to delete employee" })
        // }
        let user = await userInfo.findById(id).populate(["profile_id"]);
        if (!user) {
            return res.status(400).send({ mesaage: "User not found" })
        }
        let { date_of_birth, joining_date, marital_status, gender,
            contact_details, location_details, nationality, emergency_contact } = req.body;
        let updateUser = await profileInfo.findByIdAndUpdate(user.profile_id._id, { date_of_birth, joining_date, marital_status, gender, contact_details, location_details, nationality, emergency_contact });
        if (updateUser.status) {
            return res.status(200).json({ mesaage: "Employee details updated successfully" })
        }

    } catch (error) {
        res.status(500).send({
            message: "Could not update employee details ",
            error
        });
    }
}

exports.updateEmployeeProfession = async (req, res) => {
    try {
        let { id, hr_id } = req.params;
        console.log(id, hr_id)
        let { designation, department, reporting_manager, employee_type, current_employment, status } = req.body;
        console.log(req.body, "req.body")
        let isHr = await userInfo.findById(hr_id).populate(["role"]);
        console.log(isHr, "isHr")
        if (isHr?.role?.role_value !== "admin") {
            return res.status(400).send({ message: "You don't have access to delete employee" })
        }
        let user = await userInfo.findById(id).populate(["profession_id"]);
        console.log(user, "user")   
        if (!user) {
            return res.status(400).send({ mesaage: "User not found" })
        }
        let updateProfession = await professionInfo.findByIdAndUpdate(user.profession_id._id, { designation, department, employee_type, current_employment, status });
        if (updateProfession.status) {
            return res.status(200).json({ mesaage: "Profession details updated successfully" })
        }
    } catch (error) {
        res.status(500).send({
            message: "Could not update profession details ",
            error
        });
    }
}

exports.updateEmployeeBasicDetails = async (req, res) => {
    try {
        const { data, id } = req.body;
        const { hr_id } = req.params;

        console.log(hr_id, "hr");
        console.log(id, "id");

        // Destructure fields from the data object
        const { first_name, last_name, phone, is_deleted, manager_id } = data;

        // Use $set to update only the provided fields
        const user = await userInfo.findByIdAndUpdate(
            id,
            { 
                $set: { first_name, last_name, phone, is_deleted, manager_id } 
            }
        );

        console.log(user);

        // Respond with the updated user info
        if (user) {
            res.status(200).send({
                message: "Employee details updated successfully",
                data: user
            });
        } else {
            res.status(404).send({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Could not update employee details",
            error
        });
    }
};

exports.getMonthlyLeaves = async (req, res) => {
    try {
        const { id, month, year } = req.params;
        
        // Get all approved leave records for the employee
        const leaveRecords = await db.leaveRecords.find({
            user_id: id,
            status_name: "Approved"  // Only get approved leaves
        }).populate('leave_request');  // Populate the leave request details

        // Filter leaves for the specified month and year
        const monthlyLeaves = leaveRecords.filter(record => {
            // Handle both single date and date range cases
            const dates = record.leave_request.leave_date.map(date => {
                // If it's a date range
                if (date.start_date && date.end_date && !date.start_date.includes('AM') && !date.start_date.includes('PM')) {
                    const startDate = new Date(date.start_date);
                    const endDate = new Date(date.end_date);
                    const currentDate = new Date(startDate);
                    const dates = [];
                    
                    while (currentDate <= endDate) {
                        if (currentDate.getMonth() + 1 === parseInt(month) && 
                            currentDate.getFullYear() === parseInt(year)) {
                            dates.push(new Date(currentDate));
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    return dates;
                } else {
                    // If it's a single date
                    const leaveDate = new Date(date.date);
                    if (leaveDate.getMonth() + 1 === parseInt(month) && 
                        leaveDate.getFullYear() === parseInt(year)) {
                        return [leaveDate];
                    }
                    return [];
                }
            }).flat();
            
            return dates.length > 0;
        });

        // Calculate regular leaves and half-day leaves
        let regularLeaves = 0;
        let halfDayCount = 0;

        monthlyLeaves.forEach(record => {
            if (record.leave_request.is_half_day_leave) {
                halfDayCount += 0.5;
            } else if (record.leave_request.timeoff_type === 'full_day') {
                // For date ranges, count each day
                const dates = record.leave_request.leave_date.map(date => {
                    if (date.start_date && date.end_date && !date.start_date.includes('AM') && !date.start_date.includes('PM')) {
                        const startDate = new Date(date.start_date);
                        const endDate = new Date(date.end_date);
                        const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                        return days;
                    }
                    return 1;
                }).reduce((a, b) => a + b, 0);
                regularLeaves += dates;
            }
        });

        // Calculate total leaves and loss of pay
        const totalLeaveDays = regularLeaves + (halfDayCount / 2);
        let lossOfPay = 0;

        // If total leaves exceed 1 day per month, count as loss of pay
        if (totalLeaveDays > 1) {
            lossOfPay = totalLeaveDays - 1;
        }

        res.status(200).send({
            ok: true,
            data: {
                regularLeaves,
                halfDayLeaves: halfDayCount,
                totalLeaves: totalLeaveDays,
                lossOfPay,
                month,
                year,
                leaveDetails: monthlyLeaves.map(record => ({
                    type: record.leave_request.timeoff_type,
                    dates: record.leave_request.leave_date,
                    isHalfDay: record.leave_request.is_half_day_leave,
                    comments: record.leave_request.comments
                }))
            }
        });

    } catch (error) {
        console.error('Error in getMonthlyLeaves:', error);
        res.status(500).send({
            ok: false,
            message: "Error fetching monthly leaves",
            error: error.message
        });
    }
};

// exports.getUser = async (req, res) => {
//   try {
//     const users = await userInfo
//       .find({ is_deleted: false }, { password: 0 })
//       .populate(["profession_id", "profile_id", "role"]);

//     const currentRole = await getRoleInfo(req?.userId);

//     let userArray = [];

//     if (currentRole === "Admin") {
//       const res = await getRoleName(currentRole);
//       const filterData = users?.filter(
//         (x) => x?.role?.role_name === currentRole
//       );
//       userArray = filterData;
//     } else if (currentRole === "User") {
//       const res = await getRoleName(currentRole);
//       const filterData = users?.filter(
//         (x) => x?.role?.role_name === currentRole
//       );
//       userArray = filterData;
//     } else if (currentRole === "HR") {
//       const res = await getRoleName(currentRole);
//       const filterData = users?.filter((x) => x?.role?.role_name !== "Admin");
//       userArray = filterData;
//     } else if (currentRole === "Manager") {
//       const res = await getRoleName(currentRole);
//       const filterData = users?.filter((x) => x?.role?.role_name === "User");
//       userArray = filterData;
//     }

//     if (users.length === 0) {
//       return res.status(200).send({
//         status: 200,
//         message: "Users List Retrieved",
//       });
//     }

//     res.status(200).json({ userList: userArray });
//   } catch (error) {
//     res.status(500).send({
//       status: 500,
//       message: "Error Fetching Users List",
//     });
//   }
// };

// exports.listUserDetails = async (req, res) => {
//   try {
//     const id = req.params.id;

//     const data = await userInfo
//       .findById(id, { password: 0 })
//       .populate(["profession_id", "profile_id", "role"]);

//     if (!data || data.is_deleted) {
//       return res
//         .status(404)
//         .send({ message: "The Selected User is Deleted or In Active" + id });
//     }

//     const usersInfo = {
//       first_name: data?.first_name,
//       last_name: data?.last_name,
//       email: data?.email,
//       phone: data?.phone,
//     };

//     const userDetails = [
//       {
//         users: usersInfo,
//         role: data?.role,
//         profession: data?.profession_id,
//         profile: data?.profile_id,
//       },
//     ];

//     // Return user data
//     return res.status(200).json({ userDetails: userDetails });
//   } catch (error) {
//     // Handle error
//     res.status(500).send({
//       status: 500,
//       message: "Error fetching the Users Details" + id,
//     });
//   }
// };

// Update user details by ID
// nbmbn


// exports.deleteUser = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const user = await userInfo.findById(id);
//     if (!user) {
//       return res.status(200).send({
//         message: "Something went wrong while deleting the users",
//       });
//     }
//     user.is_deleted = true;
//     user.deleted_at = new Date();
//     user.status = false;
//     await user.save();

//     res.send({
//       message: "User Deleted Successfully",
//       status: 200,
//     });
//   } catch (error) {
//     res.status(500).send({
//       message: "Could not delete User with id=" + id,
//     });
//   }
// };

// Function to log in a user

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).send({
//         status: 400,
//         message: messageConfig?.login?.required,
//       });
//     }

//     const userDetails = await userInfo.findOne({ email });

//     if (!userDetails) {
//       return res
//         .status(401)
//         .json({ message: messageConfig?.login?.userNotFound });
//     }

//     if (userDetails.soft_delete) {
//       return res
//         .status(403)
//         .json({ message: messageConfig?.login?.userDeactivated });
//     }

//     const isPasswordValid = await bcrypt.compare(
//       password,
//       userDetails.password
//     );

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: messageConfig?.login?.failure2 });
//     }
//     const token = jwt.sign({ id: userDetails._id }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     const existingSession = await userSessionInfo.findOne({
//       user_id: userDetails._id,
//     });

//     try {
//       if (existingSession) {
//         await userSessionInfo.updateOne(
//           { user_id: userDetails._id },
//           { $set: { access_token: token } }
//         );
//       } else {
//         await userSessionInfo.create({
//           user_id: userDetails._id,
//           access_token: token,
//         });
//       }
//     } catch (sessionError) {
//       return res.status(500).send({
//         status: 500,
//         message: messageConfig?.login?.failure3,
//       });
//     }

//     res.status(200).send({
//       email: userDetails.email,
//       user_id: userDetails._id,
//       username: userDetails.first_name,
//       role: userDetails.role,
//       accessToken: token,
//     });
//   } catch (error) {
//     res.status(500).send({
//       status: 500,
//       message: messageConfig?.login?.error,
//     });
//   }
// };

// exports.logoutUser = async (req, res) => {
//   try {
//     const user_id = req?.userId;

//     const { authorization } = req.headers;
//     const [authType, authToken] = authorization.split(" ");

//     const access_token = authToken;

//     if (!access_token) {
//       return res.status(400).send({
//         status: 400,
//         message: "User Id is Invalid",
//       });
//     }
//     const deleteResult = await userSessionInfo.deleteOne({ access_token });
//     if (deleteResult.deletedCount === 0) {
//       return res.status(400).send({
//         status: 400,
//         message: "Something went wrong",
//       });
//     }
//     return res.status(200).send({
//       status: 200,
//       message: "User Logged out",
//     });
//   } catch (error) {
//     return res.status(500).send({
//       status: 500,
//       message: "Something went wrong",
//     });
//   }
// };
