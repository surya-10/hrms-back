const mongoose = require("mongoose");

const timeoffSchema = new mongoose.Schema(
  {
    timeoff_details: [
      {
        shift: [
          {
            shift_name: {
              type: String,
              required: false,
            },
            start_time: {
              type: String,
              required: false,
            },
            end_time: {
              type: String,
              required: false,
            },
            days:[]
          },
        ],
        leave_balance:[
          {
            leave_type: {
              type: String,
              required: false,
            },
            leave_count: {
              type: Number,
              required: false,
            },
          }
        ]
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

timeoffSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const timeoff = mongoose.model("Timeoff", timeoffSchema);

module.exports = timeoff;
