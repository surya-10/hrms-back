const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    timeoff_history_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Timeoffhistory",
    },
    leave_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Timeoffhistory",
    },
    month_for: {
      type: String,
      required: false,
    },
    is_permission: {
      type: Boolean,
      default: true,
    },
    is_leave: {
      type: Boolean,
      default: true,
    },
    timeoff:
    {
      leave: {
        no_of_days: {
          type: Number,
          required: false,
        },
        comments: {
          type: String,
          required: false,
        }
      },
      permission: {
        hour_count: {
          type: Number,
          required: false,
        },
        comments: {
          type: String,
          required: false,
        },
        date: {
          type: String,
          required: false,
        }
      },
      half_day: {
        hour_count: {
          type: Number,
          required: false,
        },
        comments: {
          type: String,
          required: false,
        },
        date: {
          type: String,
          required: false,
        },
        half:{
          type:String,
          required:false
        }
      }
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = attendance;
