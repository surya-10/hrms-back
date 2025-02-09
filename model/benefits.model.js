const mongoose = require("mongoose");

const benefitsSchema = new mongoose.Schema(
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
    provident_fund_details: [
      {
        pf_account_number: {
          type: String,
          required: false,
        },
        uan_number: {
          type: String,
          required: false,
        },
        employer_contribution: {
          type: String,
          required: false,
        },
        employee_contribution: {
          type: String,
          required: false,
        },
        total_contribution: {
          type: String,
          required: false,
        },
        monthly_salary_cutoff: {
          type: String,
          required: false,
        },
        start_date: {
          type: String,
          required: false,
        },
        last_updated: {
          type: String,
          required: false,
        },
      },
    ],
    insurance_details: [
      {
        policy_number: {
          type: String,
          required: false,
        },
        provider_name: {
          type: String,
          required: false,
        },
        policy_type: {
          type: String,
          required: false,
        },
        coverage_amount: {
          type: String,
          required: false,
        },
        premium_amount: {
          type: String,
          required: false,
        },
        policy_start_date: {
          type: String,
          required: false,
        },
        policy_end_date: {
          type: String,
          required: false,
        },
        dependents_covered: [
          {
            name: {
              type: String,
              required: false,
            },
            age: {
              type: String,
              required: false,
            },
            relationship: {
              type: String,
              required: false,
            },
          },
        ],
        status: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

benefitsSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const benefits = mongoose.model("Benefits", benefitsSchema);

module.exports = benefits;
