const { pool } = require("../config/dbconfig");
const express = require("express");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");
const queriesuserauth = require("../queries/user");
const jwt = require("jsonwebtoken");
const { ulid } = require("ulid");
const { wmsauthvalidation } = require("../utils/auth");
const { addAbortListener } = require("pg-pool");
require("dotenv").config();

const signup = async (req, res) => {
  const client = await pool.connect();
  try {
    const currentTimestamp = Date.now();
    const content = req.body;

    const id = ulid();
    logger.info("enter into signup");
    logger.info(content);
    const username_exits = await client.query(queriesuserauth.getUserFromUsername,[content.username]);
    if(username_exits.rowCount>0){
      throw new Error("Username Already Exits");
    }

    const hashpass = await bcrypt.hash(content.password, 10);
    await client.query("BEGIN");
    const adduser = await client.query(queriesuserauth.addUser, [
      id,
      content.username,
      content.email,
      hashpass,
      content.password,
      content.role,
      content.isPublic,
      currentTimestamp,
      currentTimestamp,
    ]);
    const profile_id = ulid();

    const addprofile = await client.query(queriesuserauth.addprofile, [
      profile_id,
      id,
      content.name,
      content.bio,
      content.phone,
      content.photo_url,
      currentTimestamp,
      currentTimestamp,
    ]);
    if (adduser.rowCount > 0) {
      logger.info("user added successfully");
    } else {
      throw new Error("Error occured");
    }
    await client.query("COMMIT");
    res.status(200).send({
      status: 200,
      msg: "Data Returned Successfully",
      Data: {
        user_id: id,
        profile_id: profile_id,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(error);
    res.status(400).send({
      status: 400,
      msg: error.message,
    });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const client = await pool.connect();
  try {
    const content = req.body;
    const username = content.username;
    let data = await client.query(queriesuserauth.getUserFromUsername, [
      username,
    ]);

    if (data.rowCount == 0) {
      throw new Error("No user found");
    }
    data = data.rows[0];
    const match = await bcrypt.compare(content.password, data.hashpass);

    let dataArray = [];

    if (match) {
      console.log("data in login", data);

      // Set token expiration time to 2 seconds from the current time
      const currentTimeUTC = Date.now();
      const expirationTimeUTC = currentTimeUTC + 120 * 60 * 1000; // 20 minutes in milliseconds

      const currentTime = new Date(currentTimeUTC).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata", // Use Indian Standard Time
      });

      const expirationTime = new Date(expirationTimeUTC).toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Kolkata", // Use Indian Standard Time
        }
      );
      // Convert expiration time to 13-digit epoch timestamp
      const expirationTimeEpoch = expirationTimeUTC;

      // Sign the token with exp field
      const token = jwt.sign(
        {
          user_id: `${data.id}`,
          username: data.username,
        },
        process.env.JWT_SECRET
      );

      let result = {
        loggedIn: "true",
        user_id: data.id,
        name: data.username,
        token: token,
        exp: expirationTimeEpoch, // Include exp in the response
      };
      console.log("result in login ", result);

      res.status(200).send({
        status: 200,
        msg: "Data Returned Successfully",
        Data: result,
      });
    } else {
      throw new Error("Incorrect Password");
    }
  } catch (error) {
    logger.error(error);
    res.status(400).send({ status: 400, msg: error.message, Data: req.body });
  } finally {
    client.release();
  }
};

const getuserdetails = async (req, res) => {
  const client = await pool.connect();
  try {
    const auth = await wmsauthvalidation(req.headers, client);

    const user_id = req.query.user_id;
    const data = await client.query(queriesuserauth.getuserdetails, [user_id]);
    let result;
    if (data.rowCount > 0) {
      result = data.rows[0];
    }
    res.status(200).send({
      status: 200,
      msg: "Data Returned Successfully",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      status: 400,
      msg: error.message,
      data: req.body,
    });
  } finally {
    client.release();
  }
};
const getuserslist = async (req, res) => {
  const client = await pool.connect();
  try {
    const auth = await wmsauthvalidation(req.headers, client);
    const user_id = auth.user_id;
    let { limit, offset } = req.query;
    offset = (offset - 1) * limit;

    const user_details = await client.query(queriesuserauth.getuserdetails, [
      user_id,
    ]);
    const role = user_details.rows[0].role;
    let is_admin = false;
    if (role == "admin") {
      is_admin = true;
    }
    let user_count = `SELECT COALESCE(COUNT(*),0) AS count FROM public.users `;
    let getList = `SELECT u.id AS user_id,u.username ,u.email,u.role,u.is_public,
    p.name,p.bio,p.phone,p.photo_url,p.created_at,p.updated_at
    FROM 
     public.users u
     LEFT JOIN 
       public.profile p ON u.id = p.user_id_fk
    `;
    if (!is_admin) {
      user_count += ` WHERE is_public = true `;
      getList += ` WHERE is_public = true  `;
    }
    getList += ` ORDER BY p.name LIMIT ${limit} OFFSET ${offset} `;

    console.log(user_count);
    const count = await client.query(user_count);
    logger.info({ user_count: count.rows });
    const total_user_count = count.rows[0].count;

    const total_pages = Math.ceil(total_user_count / limit);

    const user_list = await client.query(getList);
    const result = user_list.rows;
    res.status(200).send({
      status: 200,
      msg: "Data Returned Successfully",
      data: {
        total_pages: total_pages,
        total_user: total_user_count,
        user_list: result,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      status: 400,
      msg: error.message,
      data: req.body,
    });
  } finally {
    client.release();
  }
};
const editUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const auth = await wmsauthvalidation(req.headers, client);
    const user_id = auth.user_id;
    await client.query("BEGIN");
    const content = req.body;
    const currentTimestamp = Date.now();
    const updateUser = await client.query(queriesuserauth.editUser, [
      user_id,
      content.is_public,
      content.email,
      currentTimestamp,
    ]);
    const updateprofile = await client.query(queriesuserauth.edit_profile, [
      user_id,
      content.name,
      content.bio,
      content.phone,
      content.photo_url,
      currentTimestamp,
    ]);
    if (content.change_pass) {
      const hashpass = await bcrypt.hash(content.new_password, 10);
      const uodatepass = await client.query(queriesuserauth.updatepassword, [
        user_id,
        hashpass,
        password,
        currentTimestamp,
      ]);
      if (uodatepass.rowCount > 0) {
        logger.info("user updated Successfully");
      } else {
        logger.warn("user updated Successfully");
        throw new Error("Error in password updation");
      }
    }

    if (updateUser.rowCount > 0) {
      logger.info("user updated Successfully");
    } else {
      logger.warn("user updated Successfully");
      throw new Error("user updated Successfully");
    }
    await client.query("COMMIT");
    res.status(200).send({
      status: 200,
      msg: "User Edit Successfully",
      Data: req.body,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(error);
    res.status(400).send({
      status: 400,
      msg: error.message,
      Data: req.body,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  login,
  signup,
  editUser,
  getuserdetails,
  getuserslist,
};
