const mongoose = require("mongoose");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");

const EmployeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last Name is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining Date is required"],
    },
    employeeType: {
      type: String,
      enum: ["fullTime", "intern"],
      required: [true, "Employee Type is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    role: {
      type: String,
      enum: ["manager", "jsa", "developer", "intern", "designer"],
      required: [true, "Role is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    manager: {
      type: String,
      required: false,
    },
    photo: {
      type: String, // Assuming you'll store the image path or URL
      required: false,
    },
  },
  { timestamps: true }
);

// Password hashing before saving the document
EmployeeSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.password = hashSync(this.password, genSaltSync());
  }
  next();
});

// Methods for password comparison
EmployeeSchema.methods.comparePassword = function (password) {
  return compareSync(password, this.password);
};

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = Employee;
