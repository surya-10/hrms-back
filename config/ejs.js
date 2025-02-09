const path = require("path");
const ejs = require("ejs");

exports.renderView = async (template, data) => {
  return ejs.renderFile(path.join(__dirname, `../views/${template}.ejs`), data)
}
