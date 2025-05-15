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

router.get("/add", async (req, res) => {
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const data = req.user;
  res.render("addEmployee", { data: data.admin, role: data.role, setting });
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
      `firstName,lastName,userName,email,phoneNum,password,birthDate,profileimage,idimage,status,joinDate`,
      `'${firstName}','${lastName}','${userName}','${email}','${phoneNum}','${hashpass}','${birthDate}','${
        req.files.profileImag[0].filename
      }','${JSON.stringify(idimges)}','${status}','${joindate}'`,

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
  const data = req.user;
  res.render("employeeList", {
    data: data.admin,
    employee: employeeList,
    role: data.role,
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
      `firstName = '${firstName}', lastName = '${lastName}', userName = '${userName}', email = '${email}', phoneNum = '${phoneNum}', password = '${hashpass}', birthDate = '${birthDate}', profileimage = '${profileimg}',  status = '${status}',joinDate='${joindate}'`,
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

  if (
    (await DataUpdate(
      `tbl_setting`,
      `dark_img = '${DarkLogo}', 
     light_img = '${LightLogo}', 
     employee_worktime = '${req.body.workingtime}', 
     site_titel='${req.body.sitetitle}',
     shift_start='${req.body.shiftStart}',
     shift_end='${req.body.shiftEnd}'`,
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
 
 await DataFind(`DELETE FROM tbl_weekend`)

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

module.exports = router;
