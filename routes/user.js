const express = require("express");
const router = express.Router();
const controllerUserAuth = require("../controller/userAuth");

router.post("/v1/add", controllerUserAuth.signup);
router.post("/v1/login", controllerUserAuth.login);
router.get("/v1/user-list", controllerUserAuth.getuserslist);
router.put("/v1/edit", controllerUserAuth.editUser);
router.get("/v1/details", controllerUserAuth.getuserdetails);

module.exports = router;
