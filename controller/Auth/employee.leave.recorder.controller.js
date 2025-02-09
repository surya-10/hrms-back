const mongoose = require("mongoose");
const db = require("../../model");
const LeaveRecord = require("../../model/Auth/employee.leave.recorder.model");
const employeeLeaveInfo = db.leaveRecords;

// exports.getFebruaryLeaves = async () => {
//     try {
//         const leaves = await LeaveRecord.find({
//             userId: userId,
//             date: { $regex: "-02-2025$" }
//         });

//         console.log("February Leave Records:", leaves);
//         return leaves;
//     } catch (error) {
//         console.error("Error fetching leave records:", error);
//     }
// };

// // Example Usage
// const userId = "677bc9536b34247be44cd71d"; // Replace with the actual user ID
// getFebruaryLeaves(userId);

exports.getMonths = async (req, res) => {
    try {
      let { monthFor, userId } = req.params;
      const [targetMonth, targetYear] = monthFor.split('-');
      const leaveEntries = await employeeLeaveInfo.find({ userId });
      const matchingDates = [];
      leaveEntries.forEach(entry => {
        entry.date.forEach(dateStr => {
          const [day, month, year] = dateStr.split('-');
          if (month === targetMonth && year === targetYear) {
            matchingDates.push(dateStr);
          }
        });
      });
      return res.status(200).json({ dates: matchingDates });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching leave dates", error });
    }
  };