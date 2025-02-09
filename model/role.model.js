const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
    },
    role_value: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roleSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const role = mongoose.model("Role", roleSchema);

module.exports = role;
