const express = require("express");
const router = express.Router();
const {
  DataFind,
  DataInsert,
  DataDelete,
  DataUpdate,
} = require("../config/databasrqurey");
const os = require("os");
const moment =  require('../middleware/momentZone')

const { UploadRosone } = require("../middleware/fileUploader");
const { randomFill } = require("crypto");

router.post("/attendence/:id", async (req, res) => {
  const date = moment().format("DD-MM-YYYY");

  try {
    const currantData = await DataFind(
      `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
    );

    let OldData = [];
    try {
      OldData = await DataFind(
       ` SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
      );
    } catch (err) {
      return res.status(500).json({ error: "Error fetching old attendance data" });
    }

    if (OldData[0]) {
      OldData[0].all_time = typeof OldData[0].all_time === "string" ? JSON.parse(OldData[0].all_time) : OldData[0].all_time;
    }

    const date2 = moment(OldData[OldData.length - 1]?.date, "DD-MM-YYYY");
    const date1 = moment(date, "DD-MM-YYYY");

    const diffDays = date1.diff(date2, "days");

    if (diffDays > 1) {
      const dateArray = [];
      let tempDate = date2.clone().add(1, "days");

      while (tempDate.isSameOrBefore(date1)) {
        dateArray.push(tempDate.format("DD-MM-YYYY"));
        tempDate.add(1, "days");
      }

      return res.status(200).json({
        Break: "00:00:00",
        WorkingTime: "00:00:00",
        MissingDates: dateArray,
      });
    } else if (currantData.length > 0 && currantData[0].clockOut_time === "") {
      currantData[0].all_time = typeof currantData[0].all_time === "string" ? JSON.parse(currantData[0].all_time) : currantData[0].all_time;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const all_time = currantData[0].all_time;
      let lastStatus = all_time[all_time.length - 1].status;

      if (lastStatus !== "") {
        all_time[all_time.length - 1].outtime = new Date().toISOString();
        all_time[all_time.length - 1].OutTimeIP = ip
        let status = lastStatus === 1 ? 2 : 1;
        all_time.push({ intime: new Date().toISOString(), status, outtime: "", InTimeIP:ip,OutTimeIP:""});
      } else {
        all_time.push({ intime: new Date().toISOString(), status: 1, outtime: "", InTimeIP:ip,OutTimeIP:""});
      }

      // Working Time & Break Time
      const WorkingTime = all_time.filter((t) => t.status === 1);
      const BreakTime = all_time.filter((t) => t.status === 2);

      const calculateDuration = (arr) => {
        return arr.reduce((acc, val) => {
          let start = moment(val.intime), end = moment(val.outtime);
          if (start.isValid() && end.isValid()) {
            acc.add(moment.duration(end.diff(start)));
          }
          return acc;
        }, moment.duration());
      };

      let workDur = calculateDuration(WorkingTime);
      let breakDur = calculateDuration(BreakTime);

      let ProductiveTime = `${Math.floor(workDur.asHours())}:${workDur.minutes()}:${workDur.seconds()}`;
      let totalBreakTime = `${Math.floor(breakDur.asHours())}:${breakDur.minutes()}:${breakDur.seconds()}`;
      let clockIn_ip = all_time[all_time.length-1].status === 1?  ip : currantData[0].clockIn_ip;
      try {
        const updated = await DataUpdate(`
          tbl_employee_attndence `,
          `all_time='${JSON.stringify(all_time)}',productive_time='${ProductiveTime}',break_time='${totalBreakTime}', clockIn_Ip='${clockIn_ip}'`,
          `emplyeeId = '${req.params.id}' AND date='${date}'`,
          req.hostname,
          req.protocol
        );

        if (updated === -1) throw new Error("Failed to update data");

        return res.status(200).json({
          Break: totalBreakTime,
          WorkingTime: ProductiveTime,
          MissingDates: [],
        });
      } catch (err) {
        return res.status(500).json({ error: "Error updating working/break time" });
      }
    } else if (currantData.length > 0) {
      currantData[0].all_time = typeof currantData[0].all_time === "string" ? JSON.parse(currantData[0].all_time) : currantData[0].all_time;

      let attendence = currantData[0];

      let all_time = attendence.all_time;
      let Laststatus = all_time[all_time.length - 1]?.status;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

     if (Laststatus !== "") {
        all_time[all_time.length - 1].outtime = new Date().toISOString();
        all_time[all_time.length - 1].OutTimeIP = ip
        let status = lastStatus === 1 ? 2 : 1;
        all_time.push({ intime: new Date().toISOString(), status, outtime: "", InTimeIP:ip,OutTimeIP:""});
      } else {
        all_time.push({ intime: new Date().toISOString(), status: 1, outtime: "", InTimeIP:ip,OutTimeIP:""});
      }

      try {
        const updated = await DataUpdate(`tbl_employee_attndence`,`all_time='${JSON.stringify(all_time)}',clockOut_time='',clockOut_ip='', extra_time='', total_time=''`,`emplyeeId = '${req.params.id}' AND date='${date}'`,req.hostname,req.protocol);

        if (updated === -1) throw new Error("Update failed");

        return res.status(200).json({
          Break: attendence.break_time,
          WorkingTime: attendence.productive_time,
          MissingDates: [],
        });
      } catch (err) {
        return res.status(500).json({ error: "Error updating clock-out details" });
      }
    } else {
      
      // No entry today
      const clockIn_time = moment().format("hh:mm:ss A");

      let lastdayEntry = [];
      try {
        lastdayEntry = await DataFind(`
          SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
        );
      } catch (err) {
        return res.status(500).json({ error: "Failed to get previous attendance" });
      }

 

      if(lastdayEntry.length>0){
      if (lastdayEntry[0]) {
        lastdayEntry[0].all_time = typeof lastdayEntry[0].all_time === "string" ? JSON.parse(lastdayEntry[0].all_time) : lastdayEntry[0].all_time;
      }

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const NoClockOut = lastdayEntry[lastdayEntry.length - 1] ?? null;

      if (NoClockOut && NoClockOut.clockOut_time === "") {
        try {
          const getTimeDifference = (start, end) => {
            const startTime = new Date(start);
            const endTime = new Date(end);
            const diff = endTime - startTime;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            return `${h}:${m}:${s}`;
          };

          const timeToSeconds = (time) => time.split(":").reduce((acc, t, i) => acc + Number(t) * [3600, 60, 1][i], 0);

          const secondsToTime = (secs) => {
            const h = Math.floor(secs / 3600).toString().padStart(2, "0");
            const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
            const s = (secs % 60).toString().padStart(2, "0");
            return `${h}:${m}:${s}`;
          };

          const convertTo12Hour = (time) => {
            const [hour, minute, second] = time.split(":").map(Number);
            const suffix = hour >= 12 ? "PM" : "AM";
            const h = hour % 12 || 12;
            return `${h}:${minute.toString().padStart(2, "0")}:${(second || 0).toString().padStart(2, "0")} ${suffix}`;
          };

          const endTime = `${NoClockOut.date.split("-").reverse().join("-")}T14:00:00.000Z`;
          NoClockOut.all_time[NoClockOut.all_time.length - 1].outtime = endTime;
          NoClockOut.all_time[NoClockOut.all_time.length - 1].OutTimeIP = ip;

          let breakTime = NoClockOut.break_time || "00:00:00";
          let productiveTime = NoClockOut.productive_time || "00:00:00";

          const lastEntry = NoClockOut.all_time[NoClockOut.all_time.length - 1];
          const diff = getTimeDifference(lastEntry.intime, endTime);
          if (lastEntry.status === 1) {
            productiveTime = secondsToTime(timeToSeconds(productiveTime) + timeToSeconds(diff));
          } else {
            breakTime = secondsToTime(timeToSeconds(breakTime) + timeToSeconds(diff));
          }

          const total_time = secondsToTime(timeToSeconds(productiveTime) + timeToSeconds(breakTime));
          const settingData = await DataFind("SELECT * FROM tbl_setting LIMIT 1");
          const minSeconds = timeToSeconds(settingData[0].employee_worktime);
          const actualSeconds = timeToSeconds(productiveTime);
          const extra_time = secondsToTime(actualSeconds - minSeconds);
          const ClockOut_time = convertTo12Hour(settingData[0].shift_end);

          NoClockOut.all_time.push({ intime: "", status: "", outtime: "" ,InTimeIP:"",OutTimeIP:""});

           const updated = await DataUpdate(`tbl_employee_attndence`,
            `all_time='${JSON.stringify(NoClockOut.all_time)}',clockOut_time='${ClockOut_time}',clockOut_ip='${ip}', extra_time='${extra_time}', total_time='${total_time}', productive_time='${productiveTime}',break_time ='${breakTime}'`,
            `id =${NoClockOut.id} AND date='${NoClockOut.date}'`,
            req.hostname,
            req.protocol
          );

          if (updated === -1) throw new Error("Failed to update old record");
        } catch (err) {
          return res.status(500).json({ error: "Error finalizing old attendance" });
        }
      }
}

 
 
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const all_time = [{ intime: new Date().toISOString(), outtime: "", status: 1 ,InTimeIP:ip,OutTimeIP:""}];

      try {
        const inserted = await DataInsert(
          `tbl_employee_attndence`,
         ` emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status,attendens_status, leave_resone, leave_type`,
          `'${req.params.id}', '${date}', '${JSON.stringify(all_time)}', '${clockIn_time}','${""}','${""}','${""}','${""}','${""}','${ip}','${""}','FD', 'P', '', ''`,
          req.hostname,
          req.protocol
        );

        if (inserted === -1) throw new Error("Insert failed");

        return res.status(200).json({
          Break: "00:00:00",
          WorkingTime: "00:00:00",
          MissingDates: [],
        });
      } catch (err) {
        return res.status(500).json({ error: "Error inserting new attendance" });
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    currantData[0].all_time = typeof  currantData[0].all_time === 'string' ? JSON.parse(currantData[0].all_time): currantData[0].all_time;
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime = currentTimeISO;
    //  set ip addrerss
   currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip

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

    currantData[0].all_time.push({ intime: "", status: "", outtime: currentTimeISO,InTimeIP:"",OutTimeIP:"" });

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
      }', '${req.body.leavetype}','${JSON.stringify((req.files?.attachment || []).map(val => val.filename))}'`,
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
   userData[0].all_time = typeof  userData[0].all_time === 'string' ? JSON.parse(userData[0].all_time): userData[0].all_time;

  //*******************  function  ******************
  function timeDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end)) {
      return "Invalid date format";
    }
    const timeDiff = Math.abs(end - start);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(ip);

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
    Allentrys:Allentrys,
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


router.get('/hiddenChange/:id', async (req, res) => {
  try {
    const { employee, role } = req.user;
    const id = req.params.id;

    const employeedetails = await DataFind(`SELECT * FROM employee WHERE id=${id}`);
    const date = moment().format("DD-MM-YYYY");

    const employeeData = await DataFind(
      `SELECT * FROM tbl_employee_attndence WHERE emplyeeId = '${id}' AND date = '${date}'`
    );

    const setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

    if (employeeData.length === 0) {
      return res.json({
        Break: "00:00:00",
        Working: "00:00:00",
        status: "",
      });
    }

    employeeData[0].all_time = typeof employeeData[0].all_time === 'string'
      ? JSON.parse(employeeData[0].all_time)
      : employeeData[0].all_time;

    function getTimeDifference(start, end) {
      const startTime = new Date(start);
      const endTime = new Date(end);
      let diffMs = endTime - startTime;

      const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, "0");
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
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }

    function sumTime(time1, time2) {
      const totalSeconds = timeStringToSeconds(time1) + timeStringToSeconds(time2);
      return secondsToTimeString(totalSeconds);
    }

    const lastEntry = employeeData[0].all_time[employeeData[0].all_time.length - 1];
    const currantTime = new Date().toISOString();

    let breakTime = employeeData[0].break_time || "00:00:00";
    let productiveTime = employeeData[0].productive_time || "00:00:00";

    if (lastEntry.status === 1) {
      const dif = getTimeDifference(lastEntry.intime, currantTime);
      productiveTime = sumTime(productiveTime, dif);
    } else if (lastEntry.status === 2) {
      const dif = getTimeDifference(lastEntry.intime, currantTime);
      breakTime = sumTime(breakTime, dif);
    }

    res.json({
      Break: breakTime,
      Working: productiveTime,
      status: lastEntry.status === 1 ? "true" : "false",
    });
  } catch (error) {
    console.error("Error in /hiddenChange/:id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
