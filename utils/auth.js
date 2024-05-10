const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const queriesuserauth = require("../queries/user");

async function decryptheader(header) {
  try {
    const token = header.authorization;
    const tokenValue = token ? token.split(" ")[1] : null;

    if (!tokenValue) {
      throw new Error("No token provided");
      //  res.status(400).send({message:error.message});
    }

    const jwtSecretKey = process.env.JWT_SECRET;

    const verified = jwt.verify(tokenValue, jwtSecretKey);

    if (verified) {
      console.log("Token passed Successfully");
      return verified;
    } else {
      throw new Error("Unsuccessful Verification");
    }
  } catch (error) {
    logger.error(error, "error in token");
    // const res = "Invalid Token";
    throw new Error("Invalid Token");
  }
}

async function wmsauthvalidation(header, client) {
  try {
    const auth = await decryptheader(header);
    // console.log("auth in wmsauthvalidation ", auth);
    const user_id = auth.user_id;
    // console.log("user_id in wmsauthvalidation ", user_id);
    const isexist = await client.query(queriesuserauth.getUserFromUserid, [
      user_id,
    ]);
    // console.log("isexist in wmsauthvalidation ", isexist);
    // logger.info(isexist);
    if (isexist.rowCount == 0) {
      logger.info("No user exits");
      throw new Error("No user exits");
    } else {
      return auth;
    }
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }
}
module.exports = { decryptheader, wmsauthvalidation };
