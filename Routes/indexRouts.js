const express = require('express');
const router = express.Router();
const {isAuth,isAdmin} = require('../middleware/jwtAuth')

router.use("/", require("./authRoutes"));
router.use("/admin",isAuth,isAdmin, require("./adminRoutes"));
router.use("/employee",isAuth, require("./employeeRoutes"));

router.use('/employee/',isAuth, (req, res) => {
res.redirect('/employee/dashboard');
});

router.use('/admin',isAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

router.use('/',isAuth, (req, res) => {
  res.redirect('/');
});

module.exports = router;