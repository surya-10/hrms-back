const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    info: JSON,
    type: String,
  },
  { timestamps: true }
);

RequestSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const requestLog = mongoose.model("RequestLog", RequestSchema);

module.exports = requestLog;
