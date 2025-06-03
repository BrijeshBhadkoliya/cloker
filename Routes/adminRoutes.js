const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const {
  upload,
  uploadsetting,
  UpdateIDUpload,
} = require("../middleware/fileUploader");
const bcrypt = require("bcrypt");
const {
  DataFind,
  DataInsert,
  DataUpdate,
  DataDelete,
} = require("../config/databasrqurey");
const { log } = require("console");
const uploadFolderPath = path.join(__dirname, "../public/uploads");
const moment = require("../middleware/momentZone");

router.get("/add", async (req, res) => {
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let durationtypes = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="durationType" AND status="active"`
  );
  let designationtypes = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="designationType" AND status="active"`
  );
  const data = req.user;
  res.render("addEmployee", {
    data: data.admin,
    role: data.role,
    setting,
    durationtypes,
    designationtypes,
  });
});

router.post("/add_data", upload, async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    email,
    phoneNum,
    password,
    birthDate,
    joindate,
    status,
    designation,
    duration,
  } = req.body;

  const validemail = await DataFind(
    `SELECT * FROM employee WHERE email = '${email}'`
  );
  if (validemail.length > 0) {
    req.flash(
      "error_msg",
      "This email is already registered. Please use a different one."
    );
    return res.redirect("/admin/list");
  }

  const validmobail = await DataFind(
    `SELECT * FROM employee WHERE phoneNum = '${phoneNum}'`
  );
  if (validmobail.length > 0) {
    req.flash(
      "error_msg",
      "This mobile number is already in use. Please check and try again."
    );
    return res.redirect("/admin/list");
  }

  const validUserName = await DataFind(
    `SELECT * FROM employee WHERE userName = '${userName}'`
  );
  if (validUserName.length > 0) {
    req.flash(
      "error_msg",
      "This User Name is already in use. Please check and try again."
    );
    return res.redirect("/admin/list");
  }

  let hashpass = bcrypt.hashSync(password, 10);

  let idimges = [];
  if (req.params.length > 0) {
    req.files.idImag.map((val) => {
      idimges.push(val.filename);
    });
  }

  if (
    (await DataInsert(
      `employee`,
      `firstName,lastName,userName,email,phoneNum,password,birthDate,profileimage,idimage,status,joinDate,designation,duration`,
      `'${firstName}','${lastName}','${userName}','${email}','${phoneNum}','${hashpass}','${birthDate}','${
        req.files.profileImag[0].filename
      }','${JSON.stringify(
        idimges
      )}','${status}','${joindate}','${designation}','${duration}'`,

      req.hostname,
      req.protocol
    )) == -1
  ) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }
  req.flash("success_msg", "Employee successfully added.");
  res.redirect("/admin/add");
});

router.get("/list", async (req, res) => {
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const employeeList = await DataFind(`SELECT * FROM employee`);
  const noticePeriod = await DataFind(`SELECT * FROM tbl_notice_period`);

  const data = req.user;
  res.render("employeeList", {
    data: data.admin,
    employee: employeeList,
    role: data.role,
    noticePeriod,
    setting,
  });
});

router.get("/deleteem/:id", async (req, res) => {
  if (
    (await DataDelete(
      `employee`,
      `id='${req.params.id}'`,
      req.hostname,
      req.protocol
    )) == -1
  ) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

  req.flash("success_msg", "Employee has been removed from the system.");
  res.redirect("/admin/list");
});

router.get("/status/:id", async (req, res) => {
  const employeeList = await DataFind(
    `SELECT * FROM employee WHERE id=${req.params.id}`
  );
  if (employeeList) {
    let currantsta = employeeList[0].status;
    let updatesta = currantsta === "active" ? "deactive" : "active";
    if (
      (await DataUpdate(
        `employee`,
        `status='${updatesta}'`,
        `id = '${req.params.id}'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }
  return res.status(200).send(`Employee status updated to`);
});

router.get("/editem/:id", async (req, res) => {
  const { employee, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const employeeList = await DataFind(
    `SELECT * FROM employee WHERE id=${req.params.id}`
  );
  return res.render("UpEmployee", {
    data: employeeList[0],
    employee,
    role,
    setting,
  });
});

router.post("/updateEm", upload, async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    email,
    phoneNum,
    password,
    birthDate,
    status,
    joindate,
    editid,
    duration,
    designation,
  } = req.body;

  const user = await DataFind(`SELECT * FROM employee WHERE id = '${editid}'`);

  if (user[0].email !== email) {
    const validemail = await DataFind(
      `SELECT * FROM employee WHERE email = '${email}' AND id NOT IN (${editid})`
    );
    console.log("validemail", validemail);

    if (validemail.length > 0) {
      req.flash(
        "error_msg",
        "This email is already registered. Please use a different one."
      );
      return res.redirect("/admin/list");
    }
  }

  if (user[0].phoneNum !== phoneNum) {
    const validmobail = await DataFind(
      `SELECT * FROM employee WHERE phoneNum='${phoneNum}' AND  id NOT IN (${editid})`
    );
    console.log("validmobail", validmobail);

    if (validmobail.length > 0) {
      req.flash(
        "error_msg",
        "This mobile number is already in use. Please check and try again."
      );
      return res.redirect("/admin/list");
    }
  }

  if (user[0].userName !== userName) {
    const validUserName = await DataFind(
      `SELECT * FROM employee WHERE userName = '${userName}' AND id NOT IN (${editid})`
    );
    if (validUserName.length > 0) {
      req.flash(
        "error_msg",
        "This User Name is already in use. Please check and try again."
      );
      return res.redirect("/admin/list");
    }
  }

  // const Olddata = ``;
  const Olddata = await DataFind(`SELECT * FROM employee WHERE id=${editid}`);

  if (Olddata.length === 0) {
    req.flash("error_msg", "Employee Not Found");
    res.redirect("/admin/add");
  }

  const oldData = Olddata[0];
  let profileimg = "";
  if (req.files?.profileImag) {
    profileimg = req.files.profileImag[0].filename;
  } else {
    profileimg = oldData.profileimage;
  }

  let hashpass = bcrypt.hashSync(password, 10);
  if (
    (await DataUpdate(
      `employee`,
      `firstName = '${firstName}', lastName = '${lastName}', userName = '${userName}', email = '${email}', phoneNum = '${phoneNum}', password = '${hashpass}', birthDate = '${birthDate}', profileimage = '${profileimg}',  status = '${status}',joinDate='${joindate}',duration='${duration}',designation='${designation}'`,
      `id = '${editid}'`,
      req.hostname,
      req.protocol
    )) == -1
  ) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

  req.flash("success_msg", "Employee details updated successfully.");
  res.redirect("/admin/list");
});

router.get("/setting", async (req, res) => {
  let isData = await DataFind(`SELECT * FROM tbl_setting`);

  console.log(isData);
  if (isData.length <= 0) {
    if (
      (await DataInsert(
        `tbl_setting`,
        `dark_img, light_img, employee_worktime, site_titel`,
        `'${"default"}', '${"defult"}', '${"00:00:00"}', '${"attendens"}'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const data = req.user;
  res.render("setting", { data: data.employee, role: data.role, setting });
});

router.post("/settingProfile/:id", uploadsetting, async (req, res) => {
  // console.log(req.body);
  // console.log(req.files);

  //***********function ****************/

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

  function convertToISOString(hour, minute) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0); // Set hours, minutes, seconds, milliseconds
    return date.toISOString();
  }

  //***********function end****************/

  let startshift = req.body.shiftStart.split(":").map(Number);
  let endshift = req.body.shiftEnd.split(":").map(Number);

  // console.log("startshift",startshift);
  // console.log("endshift",endshift);

  let workingtime = getTimeDifference(
    convertToISOString(startshift[0], startshift[1]),
    convertToISOString(endshift[0], endshift[1])
  );
  // console.log(workingtime);

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  let DarkLogo =
    req.files && req.files.darklogo && req.files.darklogo[0]
      ? req.files.darklogo[0].filename
      : setting?.[0]?.dark_img || "";
  let LightLogo =
    req.files && req.files.lightlogo && req.files.lightlogo[0]
      ? req.files.lightlogo[0].filename
      : setting?.[0]?.light_img || "";
  console.log(req.body);

  if (
    (await DataUpdate(
      `tbl_setting`,
      `dark_img = '${DarkLogo}', 
     light_img = '${LightLogo}', 
     employee_worktime = '${req.body.workingtime}', 
     site_titel='${req.body.sitetitle}',
     shift_start='${req.body.shiftStart}',
     shift_end='${req.body.shiftEnd}',
     payroll_date='${req.body.payroll}',
     break_time='${req.body.breaktime}',
     notice_period='${req.body.noticperiod}'`,
      `id = '${req.params.id}'`,
      req.hostname,
      req.protocol
    )) == -1
  ) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

  res.redirect("/admin/setting");
});

router.get("/attendance", async (req, res) => {
  try {
    let date = new Date()
      .toISOString()
      .split("T")[0]
      .split("-")
      .reverse()
      .join("-");
    // console.log(date);

    const employeeList = await DataFind(
      `SELECT ea.*, em.userName AS em_name 
        FROM employee AS em
        JOIN tbl_employee_attndence AS ea ON ea.emplyeeId = em.id AND ea.date = '${date}'
        WHERE em.status = 'active'`
    );

    // console.log(employeeList);
    let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

    res.render("admin_employee", { role: 1, employeeList, setting });
  } catch (error) {
    console.log(error);
  }
});

router.get("/attendlist/:id", async (req, res) => {
  const { employee, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' ORDER BY id DESC`
  );
  const employeeId = req.params.id;
  res.render("attendlistadmin", {
    role,
    employee,
    currantData,
    employeeId,
    setting,
  });
});

router.post("/attendDate", async (req, res) => {
  // console.log(req.body);

  const employeeList = await DataFind(
    `SELECT ea.*, em.userName AS em_name 
        FROM employee AS em
        JOIN tbl_employee_attndence AS ea ON ea.emplyeeId = em.id AND ea.date = '${req.body.date}'
        WHERE em.status = 'active' ORDER BY em.id DESC`
  );
  // console.log("selectentry", employeeList);
  res.status(200).json(employeeList);
});

router.post("/workerList/:id", async (req, res) => {
  const employeeList = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId = '${
      req.params.id
    }' AND date IN (${req.body.data
      .map((d) => `'${d}'`)
      .join(", ")}) ORDER BY id DESC`
  );
  // console.log(employeeList);
  res.status(200).json(employeeList);
});

router.get("/account", async (req, res) => {
  const { admin, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const proDetails = await DataFind(
    `SELECT * FROM tbl_admin WHERE id=${admin.id}`
  );
  // console.log("proDetails",proDetails,setting);

  res.render("AdminProfile", { role, admin, proDetails, setting });
});

router.post("/updateadmin/", async (req, res) => {
  try {
    const { editid, name, email, country, phone, password } = req.body;

    const oldData = await DataFind(
      `SELECT * FROM tbl_admin WHERE id=${editid}`
    );

    if (!oldData || oldData.length === 0) {
      req.flash("errors", "Admin not found.");
      return res.redirect("/valid_license");
    }

    const haspass =
      password.trim() !== ""
        ? bcrypt.hashSync(password.trim(), 10)
        : oldData[0].password;

    const updateResult = await DataUpdate(
      `tbl_admin`,
      `name='${name}', 
       email='${email}', 
       country='${country}', 
       phone='${phone}', 
       password='${haspass}'`,
      `id='${editid}'`,
      req.hostname,
      req.protocol
    );
    if (updateResult === -1) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }

    req.flash("success", "Admin updated successfully.");
    return res.redirect("/admin/account");
  } catch (err) {
    console.error("Update Admin Error:", err);
    req.flash("errors", "Something went wrong.");
    return res.redirect("/valid_license");
  }
});

router.get("/UpIdpro/:id", async (req, res) => {
  const { admin, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let IdProofImg = await DataFind(
    `SELECT idimage, id FROM employee WHERE id=${req.params.id}`
  );

  let IdimgObj = [];
  if (IdProofImg.length > 0 && IdProofImg[0].idimage) {
    try {
      IdimgObj =
        typeof IdProofImg[0].idimage === "string"
          ? JSON.parse(IdProofImg[0].idimage)
          : IdProofImg[0].idimage;
    } catch (error) {
      IdimgObj = [];
    }
  }

  res.render("UpIdProof", {
    role,
    admin,
    setting,
    IdPic: IdimgObj,
    Idarray: IdProofImg[0],
  });
});

router.post("/IdDelete/:id/:imageName", async (req, res) => {
  const { id, imageName } = req.params;
  const fs = require("fs");
  const path = require("path");

  const filePath = path.join(__dirname, "public/uploads", imageName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  let IdProofImg = await DataFind(
    `SELECT idimage ,id FROM employee WHERE id='${id}'`
  );
  const IDimg =
    typeof IdProofImg[0].idimage === "string"
      ? JSON.parse(IdProofImg[0].idimage)
      : IdProofImg[0].idimage;
  const newImageArray = IDimg.filter((val) => val !== imageName);

  console.log("IDimg", IDimg);

  const updated = await DataUpdate(
    `employee`,
    `idimage='${JSON.stringify(newImageArray)}'`,
    `id = '${id}'`,
    req.hostname,
    req.protocol
  );
  if (updated === -1) throw new Error("Update failed");

  res.redirect(`/admin/UpIdpro/${id}`);
});

router.post("/IdUpdate/:id/:imageName", UpdateIDUpload, async (req, res) => {
  const { id, imageName } = req.params;

  const fs = require("fs");
  const path = require("path");

  const filePath = path.join(__dirname, "../public/uploads", imageName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  let IdProofImg = await DataFind(
    `SELECT   id, idimage FROM employee WHERE id='${id}'`
  );
  const IDimg =
    typeof IdProofImg[0].idimage === "string"
      ? JSON.parse(IdProofImg[0].idimage)
      : IdProofImg[0].idimage;
  IDimg[req.query.index] = req.file.filename;

  //  console.log("IDimg",IDimg);
  let ic = IDimg[req.query.index];
  if (ic) {
    const updated = await DataUpdate(
      `employee`,
      `idimage='${JSON.stringify(IDimg)}'`,
      `id = '${id}'`,
      req.hostname,
      req.protocol
    );
    if (updated === -1) throw new Error("Update failed");
  }

  res.redirect(`/admin/UpIdpro/${id}`);
});

router.post("/addIDimg/:id", upload, async (req, res) => {
  const { id } = req.params;
  console.log(req.files);

  const employeeData = await DataFind(
    `SELECT * FROM employee WHERE id='${id}'`
  );
  const IDimg =
    typeof employeeData[0].idimage === "string"
      ? JSON.parse(employeeData[0].idimage)
      : employeeData[0].idimage;

  req.files.idImag.map((val) => {
    IDimg.push(val.filename);
  });

  const updated = await DataUpdate(
    `employee`,
    `idimage='${JSON.stringify(IDimg)}'`,
    `id = '${id}'`,
    req.hostname,
    req.protocol
  );
  if (updated === -1) throw new Error("Update failed");

  res.redirect(`/admin/UpIdpro/${id}`);
});

router.get("/weekend/", async (req, res) => {
  const { admin, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let weekendData = await DataFind(`SELECT * FROM tbl_weekend`);
  console.log(weekendData);

  res.render("weekend", { admin, role, setting, weekendData });
});

router.post("/weekends/", async (req, res) => {
  console.log(req.body);

  await DataFind(`DELETE FROM tbl_weekend`);

  for (const [day, weeksArray] of Object.entries(req.body)) {
    const weeks = weeksArray.join(",");

    const result = await DataInsert(
      `tbl_weekend`,
      `days,weeks`,
      `'${day}','${weeks}'`,
      req.hostname,
      req.protocol
    );

    if (result == -1) {
      req.flash("errors", process.env.dataerror + ` for ${day}`);
      return res.redirect("/valid_license");
    }
  }

  res.redirect("/admin/weekend");
});

router.get("/typesetting/", async (req, res) => {
  const { admin, role } = req.user;

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  let levetypes = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="leaveType"`
  );

  let durationtypes = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="durationType"`
  );

  let designationtypes = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="designationType"`
  );

  res.render("typesetting", {
    setting,
    admin,
    role,
    levetypes,
    durationtypes,
    designationtypes,
  });
});

router.post("/typeadd/", async (req, res) => {
  const { typeName, typeValue, editId } = req.body;
  console.log(req.body);

  if (!editId || editId === "") {
    if (
      (await DataInsert(
        `tbl_type_setting`,
        `type_name, type_values,status`,
        `'${typeName}', '${typeValue}','${"active"}'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
    res.redirect("/admin/typesetting");
  } else {
    const updateResult = await DataUpdate(
      `tbl_type_setting`,
      `type_values='${typeValue}'`,
      `id='${editId}'`,
      req.hostname,
      req.protocol
    );
    if (updateResult === -1) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
    res.redirect("/admin/typesetting");
  }
});

router.get("/deletetype/:id", async (req, res) => {
  console.log(req.params.id);
  if (
    (await DataDelete(
      `tbl_type_setting`,
      `id='${req.params.id}'`,
      req.hostname,
      req.protocol
    )) == -1
  ) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

  res.redirect("/admin/typesetting");
});

router.get("/typestatus/:id", async (req, res) => {
  const tyestatus = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE id=${req.params.id}`
  );

  if (tyestatus) {
    let currantsta = tyestatus[0].status;

    let updatesta = currantsta === "active" ? "deactive" : "active";
    if (
      (await DataUpdate(
        `tbl_type_setting`,
        `status='${updatesta}'`,
        `id = '${req.params.id}'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }
  return res.status(200).send(`Employee status updated to`);
});

router.get("/leavereson/", async (req, res) => {
  const { admin, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  // let attendDate = await DataFind(`SELECT att.emplyeeId, lea.start_date, lea.end_date, lea.leave_attachment,lea.leave_type,lea.leave_resone,lea.leave_status,lea.emp_Id, lea.innsert_date , emp.firstName, emp.lastName ,emp.profileimage FROM tbl_employee_attndence AS att JOIN employee AS emp ON att.emplyeeId = emp.id JOIN tbl_leave_resons AS lea ON att.leave_resone_id = lea.id WHERE att.attendens_status='A' ANd att.leave_status = 'Pending'`)

  const EmployeeId = await DataFind(
    `SELECT DISTINCT emplyeeId FROM tbl_employee_attndence WHERE attendens_status="A" AND leave_status IN ('Pending', 'Appove', 'Reject');`
  );
  // console.log(EmployeeId);

  // let attendDate =
  //   await DataFind(`SELECT att.emplyeeId, lea.start_date,lea.emp_Id, lea.host_comment , lea.total_days, lea.end_date, lea.leave_attachment,lea.leave_type,lea.leave_resone,lea.leave_status,lea.id,
  //                                       lea.innsert_date , emp.firstName, emp.lastName ,emp.profileimage
  //                                       FROM tbl_leave_resons AS lea
  //                                       JOIN employee AS emp ON lea.emp_Id = emp.id
  //                                       JOIN tbl_employee_attndence AS att ON att.emplyeeId= lea.emp_Id
  //                                       WHERE lea.emp_Id IN (${EmployeeId.map(
  //                                         (val) => `'${val.emplyeeId}'`
  //                                       ).join(", ")})
  //                                       GROUP BY lea.id , lea.start_date
  //                                       ORDER BY lea.start_date DESC
  //                                       `);

  let attendDate = await DataFind(`SELECT att.emplyeeId,
                                        lea.start_date,
                                        lea.emp_Id, lea.host_comment, lea.total_days, 
                                        lea.end_date,
                                        lea.leave_attachment, lea.leave_type,
                                        lea.leave_resone, lea.leave_status, lea.id,
                                        lea.innsert_date, emp.firstName, emp.lastName, emp.profileimage 
                                 FROM tbl_leave_resons AS lea 
                                 JOIN employee AS emp ON lea.emp_Id = emp.id 
                                 JOIN tbl_employee_attndence AS att ON att.emplyeeId = lea.emp_Id
                                 WHERE lea.emp_Id IN (${EmployeeId.map(
                                   (val) => `'${val.emplyeeId}'`
                                 ).join(", ")})
                                 GROUP BY lea.id, lea.start_date
                                 ORDER BY lea.start_date DESC`);

  attendDate = attendDate.map((item) => {
    try {
      item.leave_attachment = JSON.parse(item.leave_attachment || "[]");
    } catch (e) {
      item.leave_attachment = [];
    }
    return item;
  });

  console.log("attendDate", attendDate);

  res.render("leveResone", { setting, admin, role, attendDate });
});

router.post("/hostmessage/", async (req, res) => {
  console.log(req.body);
  const updateResult = await DataUpdate(
    `tbl_leave_resons`,
    `host_comment='${req.body.hostmessage}',leave_status='${req.body.hoststaus}'`,
    `id='${req.body.editId}'`,
    req.hostname,
    req.protocol
  );
  if (updateResult === -1) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

  const attendleavSta = await DataUpdate(
    `tbl_employee_attndence`,
    `leave_status='${req.body.hoststaus}'`,
    `emplyeeId='${req.body.empId}' AND leave_resone_id='${req.body.editId}'`,
    req.hostname,
    req.protocol
  );
  if (attendleavSta === -1) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }
  return res.redirect("/admin/leavereson");
});

router.get("/adnoticperi/:id", async (req, res) => {
  let date = moment().format("DD-MM-YYYY");

  const result = await DataInsert(
    `tbl_notice_period`,
    `status,start_date,emp_Id`,
    `'active','${date}','${req.params.id}'`,
    req.hostname,
    req.protocol
  );

  if (result == -1) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }
  res.redirect("/admin/list/");
});

router.get("/monthlyttend/", async (req, res) => {
  const { admin, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let employee = await DataFind(`SELECT * FROM employee`);

  let startOfMonth = moment().startOf("month");
  let endOfMonth = moment().endOf("month");

  let allDates = [];

  let currentDate = startOfMonth.clone();

  while (currentDate.isSameOrBefore(endOfMonth)) {
    allDates.push(currentDate.format("DD-MM-YYYY"));
    currentDate.add(1, "day");
  }
  console.log(allDates);
  let dateFormate = [];

  allDates.map((val, i) => {
    dateFormate.push(moment(val, "DD-MM-YYYY").format("MMM, DD ddd"));
  });

  console.log(dateFormate);

  let attendlist = await Promise.all(
    employee.map(async (val) => {
      let employeeData = await DataFind(`
      SELECT 
        att.attendens_status, 
        att.date, 
        att.leave_status,
        att.day_status,
        emp.userName, 
        emp.profileimage,
        att.clockIn_time,
        att.clockOut_time,
        att.productive_time
        FROM tbl_employee_attndence AS att
        JOIN employee AS emp ON att.emplyeeId = emp.id
        WHERE att.emplyeeId = '${val.id}'
        AND MONTH(STR_TO_DATE(att.date, '%d-%m-%Y')) = MONTH(CURDATE())
        AND YEAR(STR_TO_DATE(att.date, '%d-%m-%Y')) = YEAR(CURDATE())
    `);

      return {
        id: val.id,
        userName: val.userName,
        profileimage: val.profileimage,
        attendance: employeeData,
      };
    })
  );

  console.log(attendlist[0].attendance);
  console.log(attendlist);

  res.render("monthlyattend", {
    setting,
    admin,
    role,
    attendlist,
    dateFormate,
    allDates,
  });
});


router.post("/monthlyattend/", async (req, res) => {
  try {
  
    const inputDate = req.body.date;  
 

    if (!inputDate) {
      return res.status(400).json({ error: "Date is required in DD-MM-YYYY format" });
    }

    const inputMoment = moment(inputDate, "DD-MM-YYYY");

    if (!inputMoment.isValid()) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    
    const startOfMonth = inputMoment.clone().startOf("month");
    const endOfMonth = inputMoment.clone().endOf("month");

 
    let allDates = [];
    let dateIterator = startOfMonth.clone();

    while (dateIterator.isSameOrBefore(endOfMonth)) {
      allDates.push(dateIterator.format("DD-MM-YYYY"));
      dateIterator.add(1, "day");
    }

  
    let dateFormate = allDates.map((val) =>
      moment(val, "DD-MM-YYYY").format("MMM, DD ddd")
    );

 
  
    const employee = await DataFind(`SELECT * FROM employee`);

   
    const attendlist = await Promise.all(
      employee.map(async (val) => {
        const employeeData = await DataFind(`
          SELECT 
            att.attendens_status, 
            att.date, 
            att.leave_status,
            att.day_status,
            emp.userName, 
            emp.profileimage,
            att.clockIn_time,
            att.clockOut_time,
            att.productive_time
            FROM tbl_employee_attndence AS att
            JOIN employee AS emp ON att.emplyeeId = emp.id
            WHERE att.emplyeeId = '${val.id}'
            AND MONTH(STR_TO_DATE(att.date, '%d-%m-%Y')) = ${inputMoment.month() + 1}
            AND YEAR(STR_TO_DATE(att.date, '%d-%m-%Y')) = ${inputMoment.year()}
        `);

        return {
          id: val.id,
          userName: val.userName,
          profileimage: val.profileimage,
          attendance: employeeData,
        };
      })
    );

 
    res.status(200).json({attendlist,dateFormate,allDates});

  } catch (error) {
    console.error("Error in POST /monthlyattend/:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
