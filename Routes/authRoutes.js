const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const moment = require("../middleware/momentZone");
const jwt = require("jsonwebtoken");

const { isAuth, isAdmin } = require("../middleware/jwtAuth");
const { DataFind, DataInsert } = require("../config/databasrqurey");

router.get("/admin/dashboard", isAuth, isAdmin, async (req, res) => {
  const data = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let newdata = await DataFind(
    `SELECT * FROM tbl_admin WHERE id=${data.admin.id}`
  );

  console.log(newdata);

  // BrithDay Array
  const month = moment().format("MM");

  const BrithDayArr =
    await DataFind(`SELECT firstName, lastName, birthDate, profileimage,
           TIMESTAMPDIFF(YEAR, birthDate, CURDATE()) AS age
    FROM employee
    WHERE birthDate LIKE CONCAT('____-${month}-%')`);

  console.log("BrithDayArr", BrithDayArr);

  const currantDate = new Date()
    .toISOString()
    .split("T")[0]
    .split("-")
    .reverse()
    .join("-");
  console.log(currantDate);

  const formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  console.log(formattedDate);

  let employeeData = await DataFind("SELECT * FROM employee");
  // console.log("employeeData",employeeData);
  let todayAttend = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE date='${currantDate}'`
  );
  // console.log("todayAttend",todayAttend);

  const mergedData = employeeData.map((emp) => {
    const attendance = todayAttend.find(
      (att) => att.emplyeeId === String(emp.id)
    );

    return {
      emplyeeId: emp.id,
      profileimage: emp.profileimage,
      firstName: emp.firstName,
      lastName: emp.lastName,
      productive_time:
        attendance && attendance.productive_time
          ? attendance.productive_time
          : "00:00:00",
      attendens_status: attendance ? attendance.attendens_status : "A",
      date: formattedDate,
    };
  });

  // console.log(mergedData);

  //  console.log(data);

  res.render("index", {
    data: data.admin,
    role: data.role,
    setting,
    newdata,
    mergedData,
    BrithDayArr,
  });
});

router.get("/employee/dashboard", isAuth, async (req, res) => {
  const { employee, role } = req.user;
      //  console.log("employee",employee);
        
  const employeedetais = await DataFind(
    `SELECT * FROM employee WHERE id=${employee.id}`
  );
  const date = moment().format("DD-MM-YYYY");
  const employeeData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId = '${employee.id}' AND date = '${date}'`
  );

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const month = moment().format("MM");

  const BrithDayArr =
    await DataFind(`SELECT firstName, lastName, birthDate, profileimage,
           TIMESTAMPDIFF(YEAR, birthDate, CURDATE()) AS age
    FROM employee
    WHERE birthDate LIKE CONCAT('____-${month}-%')`);

  // console.log("BrithDayArr", BrithDayArr);

  let leaveType = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="leaveType" AND status="active"`
  );

  if (employeeData.length > 0) {
    // *****************functions *******************************
    employeeData[0].all_time =
      typeof employeeData[0].all_time === "string"
        ? JSON.parse(employeeData[0].all_time)
        : employeeData[0].all_time;

    function getTimeDifference(start, end) {
      const startTime = new Date(start);
      const endTime = new Date(end);

      let diffMs = endTime - startTime;

      const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(
        2,
        "0"
      );
      diffMs %= 1000 * 60 * 60;
      const minutes = String(Math.floor(diffMs / (1000 * 60))).padStart(2, "0");
      diffMs %= 1000 * 60;
      const seconds = String(Math.floor(diffMs / 1000)).padStart(2, "0");

      return `${hours}:${minutes}:${seconds}`;
    }

    function timeStringToSeconds(timeStr) {
      const [hours, minutes, seconds] = timeStr.split(":").map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    }

    function secondsToTimeString(totalSeconds) {
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
        2,
        "0"
      );
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }

    function sumTime(time1, time2) {
      const totalSeconds =
        timeStringToSeconds(time1) + timeStringToSeconds(time2);
      return secondsToTimeString(totalSeconds);
    }

    // *****************functions end *******************************

    let breakTime = employeeData[0].break_time;
    let productiveTime = employeeData[0].productive_time;
    const currantTime = new Date().toISOString();

    console.log(productiveTime);

    const lastEntry =
      employeeData[0].all_time[employeeData[0].all_time.length - 1] !==
      undefined
        ? employeeData[0].all_time[employeeData[0].all_time.length - 1]
        : [];
    // console.log(employeeData[0]);

    if (lastEntry.status === 1) {
      console.log("lastEntry.intime", lastEntry.intime);
      console.log("currantTime", currantTime);

      let difrence = getTimeDifference(lastEntry.intime, currantTime);
      console.log("difrence", difrence);
      productiveTime =
        sumTime(productiveTime, difrence) === "NaN:NaN:NaN"
          ? difrence
          : sumTime(productiveTime, difrence);
      console.log("productiveTime", productiveTime);
    } else if (lastEntry.status === 2) {
      let difrence = getTimeDifference(lastEntry.intime, currantTime);
      console.log(difrence);
      breakTime =
        sumTime(breakTime, difrence) === "NaN:NaN:NaN"
          ? difrence
          : sumTime(breakTime, difrence);
      console.log(breakTime);
    }

    res.render("emPnale", {
      data: employee,
      role,
      Break: breakTime === "" ? "00:00:00" : breakTime,
      Working: productiveTime === "" ? "00:00:00" : productiveTime,
      // status: lastEntry.status === 1 ? "true" : "false"
      status:
        lastEntry.status !== ""
          ? lastEntry.status === 1
            ? "true"
            : "false"
          : "",
      setting,
      employeedetais,
      BrithDayArr,
      leaveType,
    });
  } else {
    res.render("emPnale", {
      data: employee,
      role,
      Break: "00:00:00",
      Working: "00:00:00",
      status: "",
      setting,
      employeedetais,
      BrithDayArr,
      leaveType,
    });
  }
});

router.get("/", async (req, res) => {
  const user = await DataFind(`SELECT * FROM tbl_admin`);
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  if (user.length <= 0) {
    let pass = "1234";
    let hasspass = bcrypt.hashSync(pass, 10);
    if (
      (await DataInsert(
        `tbl_admin`,
        `name,email,country,phone,password,role`,
        `'admin','admin@email.com','India','1111110001','${hasspass}','admin'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }
  res.render("loginForm", { setting });
});

router.post("/login_data", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("error_msg", "File All fields");
    res.redirect("/admin/dashboard");
  }

  const adminResult = await DataFind(
    `SELECT * FROM tbl_admin WHERE email = '${email}' OR name = '${email}'`
  );
  if (adminResult.length > 0) {
    let role = 1;

    const admin = adminResult[0];
    const validPass = bcrypt.compareSync(password, admin.password);

    if (validPass) {
      // const token = jwt.sign({admin,role},process.env.JWT_TOKEN_KEY,{expiresIn:'2h'});
      const token = jwt.sign({ admin, role }, process.env.JWT_TOKEN_KEY);

      res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 * 30 });

      req.flash("success_msg", "Login successfully");
      res.redirect("/admin/dashboard");
    }

    req.flash("error_msg", "Invalid password");
    res.redirect("/");
  } else {
    const sqlEmployee = await DataFind(
      `SELECT * FROM employee WHERE email = '${email}' OR userName = '${email}'`
    );
    let role = 2;
    if (sqlEmployee.length > 0) {
      console.log(sqlEmployee[0].status);

      if (sqlEmployee[0].status === "active") {
        const employee = sqlEmployee[0];
        const validPass = bcrypt.compareSync(password, employee.password);

        if (validPass) {
          // const token = jwt.sign({employee,role},process.env.JWT_TOKEN_KEY,{expiresIn:'2h'});
          const token = jwt.sign({ employee, role }, process.env.JWT_TOKEN_KEY);
          res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 * 30 });

          req.flash("success_msg", "Login successfully");
          return res.redirect("/employee/dashboard");
        } else {
          req.flash("error_msg", "Invalid password");
          res.redirect("/");
        }
      } else {
        req.flash("error_msg", "You cannot log in.");
        res.redirect("/");
      }
    } else {
      req.flash("error_msg", "User not found");
      res.redirect("/");
    }
  }
});

router.get("/logout", (req, res) => {
  req.user = null;
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destroy error:", err);
      }
    });
  }
  res.setHeader("Cache-Control", "no-store");

  return res.redirect("/");
});

router.get("/valid_license", (req, res) => {
  res.render("valid_license");
});

module.exports = router;
