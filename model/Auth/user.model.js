const mongoose = require("mongoose");
const { compareSync, genSaltSync, hashSync } = require("bcrypt");

const UsersSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First Name is required"],
    },
    last_name: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    phone: {
      type: Number,
      required: false,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Role",
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Profile",
    },
    profession_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Profession",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Users",
      default:null
    },
  },
  { timestamps: true }
);

UsersSchema.method("toJSON", function () {
  const { __v, _id, password, ...object } = this.toObject();
  object.id = _id;
  return object;
});

UsersSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.password = this.hashPassword(this.password);
  }
  next();
});

UsersSchema.methods = {
  comparePassword(password) {
    return compareSync(password, this.password);
  },
  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  },
  hashPassword(password) {
    return hashSync(password, genSaltSync());
  },
};

const Users = mongoose.model("users", UsersSchema);

module.exports = Users;
