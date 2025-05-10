const express = require('express');
const router = express.Router();
const {isAuth,isAdmin} = require('../middleware/jwtAuth')

router.use("/", require("./authRoutes"));
router.use("/admin",isAuth,isAdmin, require("./adminRoutes"));
router.use("/employee",isAuth, require("./employeeRoutes"));

module.exports = router;