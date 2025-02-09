const express = require("express");
const employeeController = require("../controller/employeeController");
const asyncHandler = require("express-async-handler");
const multer = require("multer");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = (app) => {
  const router = express.Router();

  // Create a new employee
  router.post("/", upload.single("photo"), asyncHandler(employeeController.createEmployee));

  // Get all employees
  router.get("/", asyncHandler(employeeController.getEmployees));

  // Delete an employee by ID
  router.delete("/:id", asyncHandler(employeeController.deleteEmployee));

  app.use("/api/employee", router);
};
