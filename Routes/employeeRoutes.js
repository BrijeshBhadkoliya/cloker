const express = require("express");
const router = express.Router();
const { isAuth, isAdmin } = require("../middleware/jwtAuth");
const {
  DataFind,
  DataInsert,
  DataDelete,
  DataUpdate,
} = require("../config/databasrqurey");
const os = require("os");
const moment = require("moment");

const { UploadRosone } = require("../middleware/fileUploader");
const { randomFill } = require("crypto");

router.post("/attendence/:id", async (req, res) => {
  const date = moment().format("DD-MM-YYYY");
  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
  );

  // day diffrence

  const OldData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND  date!= '${date}' `
  );
  console.log(OldData[OldData.length - 1]);

  const date2 = moment(OldData[OldData.length - 1]?.date, "DD-MM-YYYY");
  const date1 = moment(date, "DD-MM-YYYY");
  console.log(date2);
  console.log(date1);

  const diffDays = date1.diff(date2, "days");
  console.log("Difference in days:", diffDays);

  // day diffrence end

  if (diffDays > 1) {
    const dateArray = [];

    // Clone date2 to avoid mutating original
    let tempDate = date2.clone().add(1, "days");

    while (tempDate.isSameOrBefore(date1)) {
      dateArray.push(tempDate.format("DD-MM-YYYY"));
      tempDate.add(1, "days");
    }

    console.log("Missing Dates:", dateArray);

    if (dateArray.length > 0) {
      res.status(200).json({
        Break: "00:00:00",
        WorkingTime: "00:00:00",
        MissingDates: dateArray,
      });
    }
  } else if (currantData.length > 0 && currantData[0].clockOut_time === "") {
    // All Time entrys  S

    let Laststatus =
      currantData[0].all_time[currantData[0].all_time.length - 1].status;

    if (Laststatus !== "") {
      currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
        new Date().toISOString();
      let status =
        currantData[0].all_time[currantData[0].all_time.length - 1].status === 1
          ? 2
          : 1;
      let obj = {
        intime: new Date().toISOString(),
        status: status,
        outtime: "",
      };

      currantData[0].all_time.push(obj);
    } else {
      let obj2 = {
        intime: new Date().toISOString(),
        status: 1,
        outtime: "",
      };

      currantData[0].all_time.push(obj2);
    }
    // Show Working Time And Break Time

    const WorkingTime = [];
    const BreakTime = [];
    currantData[0].all_time.map((val, i) => {
      if (val.status === 1) {
        WorkingTime.push(val);
      } else {
        BreakTime.push(val);
      }
    });

    // ProductiveTime

    let totalWorkigDuration = moment.duration();
    WorkingTime.map((val, i) => {
      let enddate = moment(val.outtime);
      let startdate = moment(val.intime);
      if (!startdate.isValid() || !enddate.isValid()) {
        console.warn(`Skipping invalid date at index ${i}`);
        return;
      }
      let duration = moment.duration(enddate.diff(startdate));
      totalWorkigDuration.add(duration);
    });

    let totalWorkingHours = Math.floor(totalWorkigDuration.asHours());
    let totalWorkingMinutes = totalWorkigDuration.minutes();
    let totalWorkingSeconds = totalWorkigDuration.seconds();

    let ProductiveTime = `${totalWorkingHours}:${totalWorkingMinutes}:${totalWorkingSeconds}`;
    console.log("ProductiveTime :", ProductiveTime);

    // BreakTime

    let totalBreakDuration = moment.duration();

    BreakTime.map((val, i) => {
      let enddate = moment(val.outtime);
      let startdate = moment(val.intime);
      if (!startdate.isValid() || !enddate.isValid()) {
        console.warn(`Skipping invalid date at index ${i}`);
        return;
      }
      let duration = moment.duration(enddate.diff(startdate));
      totalBreakDuration.add(duration);
    });

    let totalBreakHours = Math.floor(totalBreakDuration.asHours());
    let totalBreakMinutes = totalBreakDuration.minutes();
    let totaBreakSeconds = totalBreakDuration.seconds();

    let totalBreakTime = `${totalBreakHours}:${totalBreakMinutes}:${totaBreakSeconds}`;
    // console.log("Break Time :",totalBreakTime);

    // Uddate  Qureys

    if (
      (await DataUpdate(
        `tbl_employee_attndence`,
        `all_time='${JSON.stringify(
          currantData[0].all_time
        )}',productive_time='${ProductiveTime}',break_time='${totalBreakTime}'`,
        `emplyeeId = '${req.params.id}' AND date='${date}' `,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }

    res.status(200).json({
      Break: `${totalBreakTime}`,
      WorkingTime: `${ProductiveTime}`,
      MissingDates: [],
    });
  } else if (currantData.length > 0) {
    const attendence = currantData[0];
    console.log(attendence);

    let Laststatus =
      attendence.all_time[attendence.all_time.length - 1]?.status;
    console.log(
      "Status:",
      attendence.all_time[attendence.all_time.length - 1]?.status
    );

    if (Laststatus !== "") {
      attendence.all_time[attendence.all_time.length - 1].outtime =
        new Date().toISOString();
      let status =
        attendence.all_time[attendence.all_time.length - 1].status === 1
          ? 2
          : 1;
      let obj = {
        intime: new Date().toISOString(),
        status: status,
        outtime: "",
      };

      attendence.all_time.push(obj);
    } else {
      let obj2 = {
        intime: new Date().toISOString(),
        status: 1,
        outtime: "",
      };

      attendence.all_time.push(obj2);
    }

    if (
      (await DataUpdate(
        `tbl_employee_attndence`,
        `all_time='${JSON.stringify(
          attendence.all_time
        )}',clockOut_time='${""}',clockOut_ip='${""}', extra_time='${""}', total_time='${""}'`,
        `emplyeeId = '${req.params.id}' AND date='${date}' `,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
    let Break_time = attendence.break_time;
    let Productive_time = attendence.productive_time;
    console.log("Productive_time", Productive_time);

    res.status(200).json({
      Break: `${Break_time}`,
      WorkingTime: `${Productive_time}`,
      MissingDates: [],
    });
  } else {
    const date = moment().format("DD-MM-YYYY");
    const clockIn_time = moment().format("hh:mm:ss A");

    const lastdayEntry = await DataFind(
      `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND  date!= '${date}' `
    );
    let NoClockOut =
      lastdayEntry[lastdayEntry.length - 1] === undefined
        ? ""
        : lastdayEntry[lastdayEntry.length - 1];

    console.log("NoClockOut", NoClockOut);

    // stat last date Clock Out
    if (NoClockOut.clockOut_time === "") {
      // ***************** functions *******************************

      function getTimeDifference(start, end) {
        const startTime = new Date(start);
        const endTime = new Date(end);

        let diffMs = endTime - startTime;

        const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(
          2,
          "0"
        );
        diffMs %= 1000 * 60 * 60;
        const minutes = String(Math.floor(diffMs / (1000 * 60))).padStart(
          2,
          "0"
        );
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

      // extratime find helper function

      const hmsToSeconds = (hms) => {
        const [h, m, s] = hms.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      };

      const secondsToHMS = (secs) => {
        const sign = secs < 0 ? "-" : "";
        secs = Math.abs(secs);
        const h = String(Math.floor(secs / 3600)).padStart(2, "0");
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        return `${sign}${h}:${m}:${s}`;
      };

      function convertTo12HourWithSeconds(time24) {
        const [hour, minute, second] = time24.split(":").map(Number);
        const period = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${String(minute).padStart(2, "0")}:${String(
          second === undefined ? "00" : second
        ).padStart(2, "0")} ${period}`;
      }

      // ***************** functions end *******************************

      NoClockOut.all_time[
        NoClockOut.all_time.length - 1
      ].outtime = `${NoClockOut.date
        .split("-")
        .reverse()
        .join("-")}T14:00:00.000Z`;

      //  set ip addrerss
      const network = os.networkInterfaces();
      const ip =
        network.Ethernet?.filter((val) => val.family === "IPv4")[0]?.address ||
        "0.0.0.0";

      //  set Break Time and Productive Time

      let breakTime =
        NoClockOut.break_time === "" ? "00:00:00" : NoClockOut.break_time;
      let productiveTime =
        NoClockOut.productive_time === ""
          ? "00:00:00"
          : NoClockOut.productive_time;
      const currantTime = `${NoClockOut.date
        .split("-")
        .reverse()
        .join("-")}T14:00:00.000Z`;

      const lastEntry = NoClockOut.all_time[NoClockOut.all_time.length - 1];
      if (lastEntry.status === 1) {
        let difrence = getTimeDifference(lastEntry.intime, currantTime);
        console.log(difrence);
        productiveTime = sumTime(productiveTime, difrence);
        console.log("productiveTime", productiveTime);
      } else if (lastEntry.status === 2) {
        let difrence = getTimeDifference(lastEntry.intime, currantTime);
        console.log(difrence);
        breakTime = sumTime(breakTime, difrence);
        console.log("breakTime", breakTime);
      }

      //  set Total Time

      let total_time = sumTime(productiveTime, breakTime);
      console.log("total_time", total_time);

      // set Extra Time
      const settingData = await DataFind("SELECT * FROM tbl_setting LIMIT 1");

      const MinimumTime = hmsToSeconds(settingData[0].employee_worktime);
      const ProductiveTimesecons = hmsToSeconds(productiveTime);

      let extra_time = secondsToHMS(ProductiveTimesecons - MinimumTime);
      let ClockOut_time = convertTo12HourWithSeconds(settingData[0].shift_end);
      NoClockOut.all_time.push({ intime: "", status: "", outtime: "" });

      if (
        (await DataUpdate(
          `tbl_employee_attndence`,
          `all_time='${JSON.stringify(
            NoClockOut.all_time
          )}',clockOut_time='${ClockOut_time}',clockOut_ip='${ip}', extra_time='${extra_time}', total_time='${total_time}', productive_time='${productiveTime}',break_time ='${breakTime}'`,
          `id =${NoClockOut.id} AND date='${NoClockOut.date}'`,
          req.hostname,
          req.protocol
        )) == -1
      ) {
        req.flash("errors", process.env.dataerror);
        return res.redirect("/valid_license");
      }
      // console.log("NoClockOut:",NoClockOut);
    }

    const network = os.networkInterfaces();
    const ip = network.Ethernet.filter((val, i) => val.family === "IPv4")[0]
      .address;

    let all_time = [
      { intime: new Date().toISOString(), outtime: "", status: 1 },
    ];

    if (
      (await DataInsert(
        `tbl_employee_attndence`,
        `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status,attendens_status, leave_resone, leave_type`,
        `'${req.params.id}', '${date}', '${JSON.stringify(
          all_time
        )}', '${clockIn_time}','${""}','${""}','${""}','${""}','${""}','${ip}','${""}','${"FD"}', '${"P"}', '${""}', '${""}'`,
        req.hostname,
        req.protocol
      )) == -1
    ) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }
});

router.post("/clockout/:id", async (req, res) => {
  // *****************functions *******************************

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

  // extratime find helper function

  const hmsToSeconds = (hms) => {
    const [h, m, s] = hms.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const secondsToHMS = (secs) => {
    const sign = secs < 0 ? "-" : "";
    secs = Math.abs(secs);
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${sign}${h}:${m}:${s}`;
  };

  // *****************functions end *******************************

  // start controller
  const date = moment().format("DD-MM-YYYY");
  const currentTimeISO = new Date().toISOString();
  const ClcokOut = moment().format("hh:mm:ss A"); // accurate current time
  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
  );

  if (currantData.length > 0) {
    // set LastOutTime
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
      currentTimeISO;

    //  set ip addrerss
    const network = os.networkInterfaces();
    const ip =
      network.Ethernet?.filter((val) => val.family === "IPv4")[0]?.address ||
      "0.0.0.0";

    //  set Break Time and Productive Time

    let breakTime =
      currantData[0].break_time === "" ? "00:00:00" : currantData[0].break_time;
    let productiveTime =
      currantData[0].productive_time === ""
        ? "00:00:00"
        : currantData[0].productive_time;
    const currantTime = new Date().toISOString();

    const lastEntry =
      currantData[0].all_time[currantData[0].all_time.length - 1];
    if (lastEntry.status === 1) {
      let difrence = getTimeDifference(lastEntry.intime, currantTime);
      // console.log(difrence);
      productiveTime = sumTime(productiveTime, difrence);
      // console.log("productiveTime", productiveTime);
    } else if (lastEntry.status === 2) {
      let difrence = getTimeDifference(lastEntry.intime, currantTime);
      console.log(difrence);
      breakTime = sumTime(breakTime, difrence);
      // console.log("breakTime", breakTime);
    }

    //  set Total Time

    let total_time = sumTime(productiveTime, breakTime);
    // console.log(total_time);

    // set Extra Time
    const settingData = await DataFind("SELECT * FROM tbl_setting LIMIT 1");
    const MinimumTime = hmsToSeconds(settingData[0].employee_worktime);
    const ProductiveTimesecons = hmsToSeconds(productiveTime);

    let extra_time = secondsToHMS(ProductiveTimesecons - MinimumTime);

    currantData[0].all_time.push({ intime: "", status: "", outtime: "" });

    // update qureys
    const updated = await DataUpdate(
      `tbl_employee_attndence`,
      `all_time='${JSON.stringify(currantData[0].all_time)}',
     clockOut_time='${ClcokOut}',
     clockOut_ip='${ip}',
     break_time='${breakTime}',
     productive_time='${productiveTime}',
     total_time='${total_time}',
     extra_time='${
       ProductiveTimesecons > MinimumTime ? extra_time : "00:00:00"
     }'`,
      `emplyeeId = '${req.params.id}' AND date='${date}'`,
      req.hostname,
      req.protocol
    );

    if (updated == -1) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }

  return res.redirect("/employee/dashboard");
});

router.get("/attendlist", async (req, res) => {
  const { employee, role } = req.user;

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${employee.id}' ORDER BY id DESC`
  );
  console.log(employee);
  
   let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  res.render("attendlist", {
    role,
    employee,
    currantData,
    setting
  });
});

router.post("/rersonRoutes/:id", UploadRosone, async (req, res) => {
  console.log(req.body);
  console.log(req.params.id);
  console.log("files", req.files);

  function getDateRange(startDateStr, endDateStr) {
    const result = [];
    if (!endDateStr) endDateStr = startDateStr;

    const [startDay, startMonth, startYear] = startDateStr
      .split("-")
      .map(Number);
    const [endDay, endMonth, endYear] = endDateStr.split("-").map(Number);

    let currentDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    while (currentDate <= endDate) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");

      result.push(`${dd}-${mm}-${yyyy}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  let startleave = req.body.satrtdate.split("-").reverse().join("-");
  let endleave = req.body.enddate.split("-").reverse().join("-");

  for (const val of getDateRange(startleave, endleave)) {
    const leavedate = val;

    const result = await DataInsert(
      `tbl_employee_attndence`,
      `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone, leave_type,leave_attachment`,
      `'${
        req.params.id
      }', '${leavedate}', '{}', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${
        req.body.reason
      }', '${req.body.leavetype}','${JSON.stringify(
  (req.files?.attachment || []).map(val => val.filename)
)}'`,
      req.hostname,
      req.protocol
    );

    if (result == -1) {
      req.flash("errors", process.env.dataerror);
      return res.redirect("/valid_license");
    }
  }
  res.redirect("/employee/dashboard");
});

router.get("/entry/:id", async (req, res) => {
  const { employee, role } = req.user;
  const userData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE id=${req.params.id}`
  );

  //*******************  function  ******************
  function timeDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end)) {
      return "Invalid date format";
    }
    const timeDiff = Math.abs(end - start);

    const seconds = String(Math.floor((timeDiff / 1000) % 60)).padStart(2, "0");
    const minutes = String(Math.floor((timeDiff / (1000 * 60)) % 60)).padStart(
      2,
      "0"
    );
    const hours = String(
      Math.floor((timeDiff / (1000 * 60 * 60)) % 24)
    ).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  function timeStringToSeconds(timeStr) {
    // console.log("timeStr", timeStr);

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

  //*******************  function End ******************

  // total Time
  let totalTime = [];

  userData[0].all_time.map((val, i) => {
    totalTime.push(timeDifference(val.intime, val.outtime));
  });
  const filterTime = totalTime.filter((val) => {
    return val !== "Invalid date format";
  });
  console.log(filterTime);

  // Allentrys
  let Allentrys = userData[0].all_time.filter((val) => {
    return val.intime !== "";
  });

  // Working Time
  let WorkingTime = [];
  userData[0].all_time.map((val, i) => {
    if (val.status === 1) {
      WorkingTime.push(timeDifference(val.intime, val.outtime));
    }
  });
  // console.log("WorkingTime", WorkingTime);

  let TotalWorkingTime = "00:00:00";
  // console.log("TotalWorkingTime", TotalWorkingTime);

  WorkingTime.map((val, i) => {
    if(val !== "Invalid date format") {
        TotalWorkingTime = sumTime(TotalWorkingTime, val);
    }
  });

  // console.log("TotalWorkingTime", TotalWorkingTime);

  // Break Time
 
 let BreakTime = [];
  userData[0].all_time.map((val, i) => {
    if (val.status === 2) {
      BreakTime.push(timeDifference(val.intime, val.outtime));
    }
  });
  // console.log("BreakTime", BreakTime);

  let TotalBreakTime = "00:00:00";
  // console.log("TotalBreakTime", TotalBreakTime);

  BreakTime.map((val, i) => {
    if(val !== "Invalid date format") {
        TotalBreakTime = sumTime(TotalBreakTime, val);
    }
  });

  // console.log("TotalBreakTime", TotalBreakTime);
   let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  res.render("entryList", {
    employee,
    role,
    Allentrys,
    totalTime: filterTime,
    TotalWorkingTime,
    TotalBreakTime,
    ClockIn:userData[0].clockIn_time,
    ClockOut:userData[0].clockOut_time=== '' ?"00:00:00":userData[0].clockOut_time,
    date:userData[0].date,
    setting
  });
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

router.get('/account',async (req,res)=>{
  const { employee, role } = req.user;
   let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

const proDetails= await DataFind(`SELECT * FROM employee WHERE id=${employee.id}`)
console.log("proDetails",proDetails);

  res.render('emProfile',{role,employee,proDetails,setting})
})

module.exports = router;
