const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cron = require("node-cron");
const cors = require("cors");
const connectLivereload = require("connect-livereload");
const compression = require("compression");
const {
  createRequestLogInfo,
} = require("./controller/Auth/activity.controller.js");
const {
  createDefaultUser,
} = require("./controller/Auth/default.controller.js");
const { storeWorkingDays } = require("./controller/Auth/WorkingDays.controller.js");
const announcementRoutes = require('./routes/Auth/announcement.route.js');

var corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(compression());
app.use(connectLivereload());
app.use(express.static("public"));
app.use(express.json({limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to SNS IHub." });
});

app.use(async (req, res, next) => {
  try {
    const requestInformation = {
      rawHeaders: JSON.stringify(req.rawHeaders),
      rawBody: req.body,
      rawParams: req.params,
      raworiginalUrl: req.originalUrl,
    };

    await createRequestLogInfo(requestInformation);
    res.on("finish", async () => {
      // try {
      //   await createDefaultUser();
      // } catch (err) {
      //   console.error("Error creating default user:", err);
      // }
    });
  } catch (err) {
    console.error("Error logging request:", err);
  }
  next();
});

mongoose
  .connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error("DB Connection Error:", err));

require("./routes/Auth/user.route.js")(app);
require("./routes/Auth/activity.route.js")(app);
require("./routes/role.route.js")(app);
require("./routes/Auth/employee.route.js")(app);
require("./routes/Auth/timeoff.route.js")(app)
require("./routes/Auth/attendence.route.js")(app);
require("./routes/Auth/shiftDetails.route.js")(app);
require("./routes/Auth/break.route.js")(app)
require("./routes/employeeRoutes.js")(app)
require("./routes/Auth/Holiday.route.js")(app);
require("./routes/Auth/employee.leave.record.route.js")(app)
require("./routes/Auth/profile.route.js")(app);
app.use('/api/announcements', announcementRoutes);
require("./routes/Auth/apply.leave.nlp.route.js")(app)


const port = process.env.PORT || 3002;
app.listen(port, async (err) => {
  // await createDefaultUser();
  if (err) {
    console.error("Server failed to start:", err);
  } else {
    console.log("Server listening on port", port);
  }
});

cron.schedule("0 0 1 * *", async () => {
  console.log("Calculating and storing working days...");
  await storeWorkingDays();
});
storeWorkingDays();

// const chrono = require('chrono-node');

// const text = "20.02.2025 to 21.02.2025 abcdklnfdosi, 
// feb 20 2025 to feb 21 2025, 
// 20 feb 2025 to 21 feb 2025, 
// feb 20 2025 to 21 feb 2025,
//  20-02-2025 to 21-02-2025, 
// 20/02/2025 to 21/02/2025, 
// fe 20 2025 to fe 21 2025, 
// mar 20 2025 to mar 21 2025";
// const results = chrono.parse(text);
// console.log(results)

// const extractedDates = results.map(date => ({
//     start: date.start.date().toISOString().split('T')[0],
//     end: date.end ? date.end.date().toISOString().split('T')[0] : null
// }));

// console.log(extractedDates);
