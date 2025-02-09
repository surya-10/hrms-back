const db = require("../model/Auth/user.model");
const userSession = require("../model/Auth/usersession.model");
const HttpStatus = require("http-status");
const userInfo = db;
const userSessionInfo = userSession;
const jwt = require("jsonwebtoken");
const key = process?.env?.JWT_SECRET;

exports.authBearer = async (req, res, next) => {
  try {
    let userSessionTableInfo = null;
    const { authorization } = req.headers;
    const [authType, authToken] = authorization.split(" ");
    userSessionTableInfo = await userSessionInfo.findOne({
      access_token: authToken,
    });
    if (!userSessionTableInfo) {
      const tokenInvalidResponse = {
        status: 400,
        message: "Unauthorized access",
      };
      return res.status(HttpStatus.UNAUTHORIZED).send(tokenInvalidResponse);
    } else {
      const { authorization } = req.headers;
      if (!authorization)
        return res.status(HttpStatus.UNAUTHORIZED).send({
          status: 400,
          message: "Authorization Header Missing",
        });
      const [authType, authToken] = authorization.split(" ");
      const AuthorizationTypeMissing = {
        status: 400,
        message: "Authorization Type Missing",
      };
      const AuthorizationTokenMissing = {
        status: 400,
        message: "Authorization Token Missing",
      };
      const InvalidAuthorizationType = {
        status: 400,
        message: "Invalid Authorization Type",
      };
      if (!authType)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(AuthorizationTypeMissing);
      if (!authToken)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(AuthorizationTokenMissing);
      if (authType !== "Bearer")
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(InvalidAuthorizationType);
      access_token = authToken;
      const decode = jwt.verify(access_token, key);

      const res = await userInfo.findById(userSessionTableInfo?.users);
      if (!decode === res?._id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send({ message: "Unauthorized access" });
      }
      req.userId = decode.id;
      next();
    }
  } catch (error) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .send({ message: "Unauthorized access" });
  }
};
exports.authBearer2 = async (req, res, next) => {
  try {
    let userSessionTableInfo = null;
    const { authorization } = req.headers;
    const [authType, authToken] = authorization.split(" ");
    userSessionTableInfo = await userSessionInfo.findOne({
      access_token: authToken,
    });
    if (!userSessionTableInfo) {
      const tokenInvalidResponse = {
        status: 400,
        message: "Unauthorized access",
      };
      return res.status(HttpStatus.UNAUTHORIZED).send(tokenInvalidResponse);
    } else {
      const { authorization } = req.headers;
      if (!authorization)
        return res.status(HttpStatus.UNAUTHORIZED).send({
          status: 400,
          message: "Authorization Header Missing",
        });
      const [authType, authToken] = authorization.split(" ");
      const AuthorizationTypeMissing = {
        status: 400,
        message: "Authorization Type Missing",
      };
      const AuthorizationTokenMissing = {
        status: 400,
        message: "Authorization Token Missing",
      };
      const InvalidAuthorizationType = {
        status: 400,
        message: "Invalid Authorization Type",
      };
      if (!authType)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(AuthorizationTypeMissing);
      if (!authToken)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(AuthorizationTokenMissing);
      if (authType !== "Bearer")
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(InvalidAuthorizationType);
      access_token = authToken;
      const decode = jwt.verify(access_token, key);

      const res = await userInfo.findById(userSessionTableInfo?.users);
      if (!decode === res?._id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send({ message: "Unauthorized access" });
      }
      req.userId = decode.id;
      next();
    }
  } catch (error) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .send({ message: "Unauthorized access" });
  }
};