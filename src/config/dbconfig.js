require("dotenv").config();

module.exports = {
    user          : process.env.DB_USER,
    password      : process.env.DB_PASS,
    connectString : process.env.DB_HOST,
    externalAuth  :  false
  };