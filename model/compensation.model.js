const mongoose = require("mongoose");

const compensationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    updated_by: {
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
    salary_details: [
      {
        earnings: {
          type_name: {
            type: String,
            required: false,
          },
          amount: {
            type: String,
            required: false,
          },
        },
        deductions: {
          type_name: {
            type: String,
            required: false,
          },
          amount: {
            type: String,
            required: false,
          },
        },
        total_earnings: {
          type: Number,
          required: false,
        },
        total_deductions: {
          type: Number,
          required: false,
        },
        gross_pay: {
          type: Number,
          required: false,
        },
        net_pay: {
          type: Number,
          required: false,
        },
      },
    ],
    is_current: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

compensationSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const compensation = mongoose.model("Compensation", compensationSchema);

module.exports = compensation;
