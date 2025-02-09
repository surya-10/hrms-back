const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    required:false
  },
  date:{
    type:Date,
    required:false
  },
  timeoff_type: {
    type: String,
    enum: ["full_day", "half_day", "permission"],
    required: [true, "Time Off Type is required"],
  },
  leave_type: {
    type: String,
    required: false,
  },
  leave_date: [
    {
      start_date: {
        type: String,
        required: false,
      },
      end_date: {
        type: String,
        required: false,
      },
      date:{
        type:String,
        required:false
      }
    },
  ],
  is_permission: {
    type: Boolean,
    default: false,
  },
  is_half_day_leave:{
    type:Boolean,
    required:false,
    default:false
  },
  status_name: {
    type: String,
    enum: ["Requested", "Approved", "Rejected", "Cancelled"],
    required: true,
  },
  initialed_on: {
    type: Date,
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  comments: {
    type: String,
    required: true,
  },
  approval_comments:{
    type: String,
    required: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const timeoffHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Profile",
    },
    profession_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Profession",
    },
    leave_requests: [leaveRequestSchema],
  },
  { timestamps: true }
);

timeoffHistorySchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const timeoffHistory = mongoose.model("TimeoffHistory", timeoffHistorySchema);

module.exports = timeoffHistory;
