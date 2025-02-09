const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    access_token: {
      type: String,
    },
  },
  { timestamps: true }
);

userSessionSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const UserSession =
  mongoose.models.UserSession ||
  mongoose.model("userSession", userSessionSchema);

module.exports = UserSession;
