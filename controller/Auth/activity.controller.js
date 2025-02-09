const db = require("../../model");
const activityInfo = db.activity;
const requestInfo = db.request;
const messageConfig = require("../../config/message");

exports.createLog = async (data) => {
  try {
    const negativeResponse = {
      status: 400,
      message: messageConfig?.createLog?.failure,
    };
    // Ensure the required fields are present and correctly named
    if (
      !data.message ||
      !data.date ||
      !data.type ||
      !data.user_id ||
      !data.event
    ) {
      return {
        status: 400,
        ...negativeResponse,
      };
    }
    await activityInfo.create(data);
    const SuccessResponse = {
      is_created: true,
      status: 200,
    };
    return SuccessResponse;
  } catch (error) {
    return {
      status: 500,
      message: messageConfig?.createLog?.error,
    };
  }
};

exports.getLog = async (req, res) => {
  try {
    const logsInfo = await activityInfo.find();
    if (logsInfo) {
      res.status(200).json({
        message: messageConfig?.getLog?.success,
        logsInfo: logsInfo,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: messageConfig?.getLog?.error, error: error.message });
  }
};

exports.createRequestLogInfo = async (payloadInfo, next) => {
  const requestPayload = { info: payloadInfo };
  const addRequest = await requestInfo.create(requestPayload);
  return true;
  next();
};
