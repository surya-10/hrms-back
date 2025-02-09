const mongoose = require("mongoose");

const professionSchema = new mongoose.Schema(
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
    designation: {
      type: String,
      required: false,
    },
    department: {
      type: String,
      required: false,
    },
    reporting_manager: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Users",
    },
    employee_type: {
      type: String,
      enum: ["full-time", "part-time", "intern", "freelance"],
      required: [false, "Role is required"],
    },
    current_employment: {
      type: String,
      enum: ["Active", "Resigned", "Terminated"],
      required: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

professionSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const profession = mongoose.model("Profession", professionSchema);

module.exports = profession;
