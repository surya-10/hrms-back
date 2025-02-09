const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
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
    account_holder_name: {
      type: String,
      required: false,
    },
    account_number: {
      type: String,
      required: false,
    },
    bank_name: {
      type: String,
      required: false,
    },
    ifsc_code: {
      type: String,
      required: false,
    },
    branch_name: {
      type: String,
      required: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bankDetailsSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const bankDetails = mongoose.model("BankDetails", bankDetailsSchema);

module.exports = bankDetails;
