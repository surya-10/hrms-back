const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    employeeId: {
      type: String,
      required: false,
    },
    date_of_birth: {
      type: String,
      required: false,
    },
    joining_date: {
      type: String,
      required: false,
    },
    releiving_date: {
      type: String,
      required: false,
    },
    marital_status: {
      type: String,
      enum: ["single", "married", "divorced"],
      required: [false, "Marital Status is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [false, "Gender is required"],
    },
    contact_details: [
      {
        phone_number: {
          type: String,
          required: false,
        },
        email_id: {
          type: String,
          required: false,
        },
      },
    ],
    location_details: [
      {
        permanent_address: {
          type: String,
          required: false,
        },
        current_address: {
          type: String,
          required: false,
        },
      },
    ],
    nationality: {
      type: String,
      required: false,
    },
    emergency_contact: [
      {
        name: {
          type: String,
          required: false,
        },
        relationship: {
          type: String,
          required: false,
        },
        phone_number: {
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
  { timestamps: true }
);

profileSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const profile = mongoose.model("Profile", profileSchema);

module.exports = profile;
