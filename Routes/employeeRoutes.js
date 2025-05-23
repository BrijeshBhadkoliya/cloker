const express = require("express");
const router = express.Router();
const {
  DataFind,
  DataInsert,
  DataDelete,
  DataUpdate,
} = require("../config/databasrqurey");
const os = require("os");
const moment = require("../middleware/momentZone");

const { UploadRosone } = require("../middleware/fileUploader");
const { randomFill } = require("crypto");
const { log } = require("console");

router.post("/attendence/:id", async (req, res) => {
  const date = moment().format("DD-MM-YYYY");

  try {
    let currantData = [];
    try {
      currantData = await DataFind(
        `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
      );
    } catch (err) {
      return res.status(200).json({ error: "Error fetching currantData" }, err);
    }

    let OldData = [];
    try {
      OldData = await DataFind(
        `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
      );
    } catch (err) {
      return res
        .status(200)
        .json({ error: "Error fetching old attendance data" });
    }

    if (OldData[0]) {
      OldData[0].all_time =
        typeof OldData[0].all_time === "string"
          ? JSON.parse(OldData[0].all_time)
          : OldData[0].all_time;
    }

    // ************** Missing ClockOut Condition *************

    console.log("OldData[0]", OldData[OldData.length - 1]);
    let MissOut = false;
    if (OldData[OldData.length - 1].clockOut_time === "") {
      MissOut = true;
      return res.send({
        Break: "00:00:00",
        WorkingTime: "00:00:00",
        MissingClockOut: MissOut,
        OldData: OldData[OldData.length - 1],
      });
    }

    // ************** Missing ClockOut Condition *************

    const lastDate = OldData[OldData.length - 1].date;
    let NextDate = moment(lastDate, "DD-MM-YYYY")
      .add(1, "days")
      .format("DD-MM-YYYY");
    const leaveVerify = await DataFind(
      `SELECT * FROM tbl_leave_resons WHERE emp_Id = '${req.params.id}' AND start_date = '${NextDate}'`
    );

    if (leaveVerify.length > 0) {
      const date2 = moment(leaveVerify[0].start_date, "DD-MM-YYYY");
      const date1 = moment(leaveVerify[0].end_date, "DD-MM-YYYY");
      const diffDays = date1.diff(date2, "days");

      let leaveDates = [leaveVerify[0].start_date];
      for (let i = 0; i < diffDays; i++) {
        leaveDates.push(
          moment(leaveDates[i], "DD-MM-YYYY")
            .add(1, "days")
            .format("DD-MM-YYYY")
        );
      }

      // weekends verify in leave
      const finalLeaveDates = await Promise.all(
        leaveDates.map(async (val) => {
          const datedayfind = val.split("-").reverse().join("-");
          const dateObj = new Date(datedayfind);
          const dayName = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
          });

          let weekendDay = [];

          try {
            weekendDay = await DataFind(
              `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
            );
          } catch (err) {
            console.log("Error fetching weekend data", err);
            return val; // fallback, treat as normal date
          }

          if (weekendDay.length > 0) {
            let weekEnds = weekendDay[0].weeks.split(",").map(Number);
            const dayCount = Math.ceil(dateObj.getUTCDate() / 7);

            if (weekEnds.includes(dayCount)) {
              return "weekend";
            }
          }

          return val;
        })
      );
      let processedDates = [];
      finalLeaveDates.forEach(async (val, i) => {

        if (val !== "weekend") {
          console.log("Weekend date:", leaveDates[i]);
          let CurrantEntry = moment().format("DD-MM-YYYY");
          if (CurrantEntry !== leaveDates[i]) {
            const result = await DataInsert(
              `tbl_employee_attndence`,
              `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id,leave_status`,
              `'${req.params.id}', '${leaveDates[i]}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${leaveVerify[0].id}','${leaveVerify[0].leave_status}'`,
              req.hostname,
              req.protocol
            );

            if (result == -1) {
              req.flash("errors", process.env.dataerror);
              return res.redirect("/valid_license");
            }
          } else {
            return res
              .status(200)
              .json({ error_msg: "Today is weekend, you did not clock in" });
          }

        } else if (val === "weekend") {
          console.log("Weekend date:", leaveDates[i]);
          let CurrantEntry = moment().format("DD-MM-YYYY");
          if (CurrantEntry !== leaveDates[i]) {
            const result = await DataInsert(
              `tbl_employee_attndence`,
              `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
              `'${req.params.id}', '${
                leaveDates[i]
              }', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '${"-"}'`,
              req.hostname,
              req.protocol
            );

            if (result == -1) {
              req.flash("errors", process.env.dataerror);
              return res.redirect("/valid_license");
            }
          } else {
            return res
              .status(200)
              .json({ error_msg: "Today is weekend, you did not clock in" });
          }
        }

        let CurrantEntry = moment().format("DD-MM-YYYY");
        if (val !== CurrantEntry) {
          processedDates.push(val);
        }
      });
    }

    let UpdatedData = [];
    try {
      UpdatedData = await DataFind(
        `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
      );
    } catch (err) {
      return res
        .status(200)
        .json({ error: "Error fetching old attendance data" });
    }

    if (UpdatedData[0]) {
      UpdatedData[0].all_time =
        typeof UpdatedData[0].all_time === "string"
          ? JSON.parse(UpdatedData[0].all_time)
          : UpdatedData[0].all_time;
    }

    console.log(UpdatedData);

    const date2 = moment(
      UpdatedData[UpdatedData.length - 1]?.date,
      "DD-MM-YYYY"
    );
    const date1 = moment(date, "DD-MM-YYYY");
    const diffDays = date1.diff(date2, "days");

    if (diffDays > 1) {
      let dateArray = [];
      let tempDate = date2.clone().add(1, "days");

      while (tempDate.isSameOrBefore(date1)) {
        dateArray.push(tempDate.format("DD-MM-YYYY"));
        tempDate.add(1, "days");
      }
      const sqlDateList = dateArray.map((d) => `'${d}'`).join(",");
      const leaveVerify = await DataFind(
        `SELECT * FROM tbl_leave_resons WHERE emp_Id = '${req.params.id}' AND start_date IN(${sqlDateList})`
      );

      let leaveDates = [];
      leaveVerify.map((val) => {
        const leavedate2 = moment(val.start_date, "DD-MM-YYYY");
        const leavedate1 = moment(val.end_date, "DD-MM-YYYY");
        const leavediffDays = leavedate1.diff(leavedate2, "days");

        for (let i = 0; i <= leavediffDays; i++) {
          leaveDates.push(
            moment(leavedate2, "DD-MM-YYYY").add(i, "days").format("DD-MM-YYYY")
          );
        }
      });
      console.log("leaveDates",leaveDates);

      dateArray = dateArray.filter((date) => !leaveDates.includes(date));

      console.log("dateArrayfilter", dateArray);

      const missingDates = await Promise.all(
        dateArray.map(async (val) => {
          const datedayfind = val.split("-").reverse().join("-");
          const dateObj = new Date(datedayfind);
          const dayName = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
          });
          console.log(dayName, "Date", dateObj);

          let weekendDay = [];

          try {
            weekendDay = await DataFind(
              `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
            );
          } catch (err) {
            return res
              .status(200)
              .json({ error: "Error fetching weekendDay" }, err);
          }

          if (weekendDay.length > 0) {
            let weekEnds = weekendDay[0].weeks.split(",").map(Number);
            const dayCount = Math.ceil(dateObj.getUTCDate() / 7);
            // console.log(dayCount);

            if (weekEnds.includes(dayCount)) {
              console.log("Weekend day, skipping:", val);
              return "weekend";
            }
          }
          return val;
        })
      );

      // const filteredMissingDates = missingDates.filter(Boolean);
      console.log("filteredMissingDates", missingDates);
      let weekendsInserted = false;
      let processedDates = [];

      missingDates.forEach(async (val, i) => {
        if (val === "weekend" && !weekendsInserted) {
          console.log("Weekend date:", dateArray[i]);
          let CurrantEntry = moment().format("DD-MM-YYYY");
          if (CurrantEntry !== dateArray[i]) {
            const result = await DataInsert(
              `tbl_employee_attndence`,
              `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
              `'${req.params.id}', '${
                dateArray[i]
              }', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '${"-"}'`,
              req.hostname,
              req.protocol
            );

            if (result == -1) {
              req.flash("errors", process.env.dataerror);
              return res.redirect("/valid_license");
            }
          } else {
            return res
              .status(200)
              .json({ error_msg: "Today is weekend, you did not clock in" });
          }
        } else if (val !== "weekend") {
          weekendsInserted = true;
        }

        let CurrantEntry = moment().format("DD-MM-YYYY");
        if (val !== CurrantEntry) {
          processedDates.push(val);
        }
      });

      console.log("processedDates", processedDates);

      return res.status(200).json({
        Break: "00:00:00",
        WorkingTime: "00:00:00",
        MissingDates: processedDates,
      });
    } else if (currantData.length > 0 && currantData[0].clockOut_time === "") {
      const BarakCheak =
        currantData[0].all_time[currantData[0].all_time.length - 1].status;

      if (BarakCheak === 1) {
        let BreakTime = moment.duration(currantData[0].break_time).asSeconds();
        let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
        let hostsetBreack = moment.duration(setting[0].break_time).asSeconds();
        console.log(BreakTime);
        console.log(hostsetBreack);

        if (hostsetBreack < BreakTime) {
          console.log("maigc");

          return res.status(200).json({
            BreackOver: true,
            BreackTime: setting[0].break_time,
          });
        }
      }

      currantData[0].all_time =
        typeof currantData[0].all_time === "string"
          ? JSON.parse(currantData[0].all_time)
          : currantData[0].all_time;
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const all_time = currantData[0].all_time;
      let lastStatus = all_time[all_time.length - 1].status;

      if (lastStatus !== "") {
        all_time[all_time.length - 1].outtime = new Date().toISOString();
        all_time[all_time.length - 1].OutTimeIP = ip;
        let status = lastStatus === 1 ? 2 : 1;
        all_time.push({
          intime: new Date().toISOString(),
          status,
          outtime: "",
          InTimeIP: ip,
          OutTimeIP: "",
        });
      } else {
        all_time.push({
          intime: new Date().toISOString(),
          status: 1,
          outtime: "",
          InTimeIP: ip,
          OutTimeIP: "",
        });
      }

      // Working Time & Break Time
      const WorkingTime = all_time.filter((t) => t.status === 1);
      const BreakTime = all_time.filter((t) => t.status === 2);

      const calculateDuration = (arr) => {
        return arr.reduce((acc, val) => {
          let start = moment(val.intime),
            end = moment(val.outtime);
          if (start.isValid() && end.isValid()) {
            acc.add(moment.duration(end.diff(start)));
          }
          return acc;
        }, moment.duration());
      };

      let workDur = calculateDuration(WorkingTime);
      let breakDur = calculateDuration(BreakTime);

      let ProductiveTime = `${Math.floor(
        workDur.asHours()
      )}:${workDur.minutes()}:${workDur.seconds()}`;
      let totalBreakTime = `${Math.floor(
        breakDur.asHours()
      )}:${breakDur.minutes()}:${breakDur.seconds()}`;
      let clockIn_ip =
        all_time[all_time.length - 1].status === 1
          ? ip
          : currantData[0].clockIn_ip;
      try {
        const updated = await DataUpdate(
          `
          tbl_employee_attndence `,
          `all_time='${JSON.stringify(
            all_time
          )}',productive_time='${ProductiveTime}',break_time='${totalBreakTime}', clockIn_Ip='${clockIn_ip}'`,
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
        return res
          .status(200)
          .json({ error: "Error updating working/break time" });
      }
    } else if (currantData.length > 0) {
      currantData[0].all_time =
        typeof currantData[0].all_time === "string"
          ? JSON.parse(currantData[0].all_time)
          : currantData[0].all_time;

      let attendence = currantData[0];

      let all_time = attendence.all_time;
      let Laststatus = all_time[all_time.length - 1]?.status;
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      if (Laststatus !== "") {
        all_time[all_time.length - 1].outtime = new Date().toISOString();
        all_time[all_time.length - 1].OutTimeIP = ip;
        let status = lastStatus === 1 ? 2 : 1;
        all_time.push({
          intime: new Date().toISOString(),
          status,
          outtime: "",
          InTimeIP: ip,
          OutTimeIP: "",
        });
      } else {
        all_time.push({
          intime: new Date().toISOString(),
          status: 1,
          outtime: "",
          InTimeIP: ip,
          OutTimeIP: "",
        });
      }

      try {
        const updated = await DataUpdate(
          `tbl_employee_attndence`,
          `all_time='${JSON.stringify(
            all_time
          )}',clockOut_time='',clockOut_ip='', extra_time='', total_time=''`,
          `emplyeeId = '${req.params.id}' AND date='${date}'`,
          req.hostname,
          req.protocol
        );

        if (updated === -1) throw new Error("Update failed");

        return res.status(200).json({
          Break: attendence.break_time,
          WorkingTime: attendence.productive_time,
          MissingDates: [],
        });
      } catch (err) {
        return res
          .status(200)
          .json({ error: "Error updating clock-out details" });
      }
    } else {
      // No entry today
      const clockIn_time = moment().format("hh:mm:ss A");
 
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      const all_time = [
        {
          intime: new Date().toISOString(),
          outtime: "",
          status: 1,
          InTimeIP: ip,
          OutTimeIP: "",
        },
      ];

      const datelocal = new Date();
      const daycount = Math.ceil(datelocal.getUTCDate() / 7);
      const dayName = datelocal.toLocaleString("en-US", { weekday: "long" });
      const weekendDay = await DataFind(
        `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
      );

      let isWeekend = "";
      if (weekendDay.length > 0) {
        let weekenddays = weekendDay[0].weeks.split(",").map(Number);
        isWeekend = weekenddays.filter((val) => val === daycount);
      } else {
        console.log(`No weekend configuration found for day: ${dayName}`);
      }
      console.log(isWeekend);

      if (isWeekend.length === 0) {
        try {
          const inserted = await DataInsert(
            `tbl_employee_attndence`,
            ` emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status,attendens_status`,
            `'${req.params.id}', '${date}', '${JSON.stringify(
              all_time
            )}', '${clockIn_time}','${""}','${""}','${""}','${""}','${""}','${ip}','${""}','FD', 'P'`,
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
          return res
            .status(500)
            .json({ error_msg: "Error inserting new attendance" });
        }
      } else {
        console.log("wekk");
        return res
          .status(200)
          .json({ error_msg: "Today is weekend, you did not clock in" });
        // res.redirect("/employee/dashboard");
      }

    }
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(200).json({ error_msg: "Internal server error", err });
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

  const date = moment().format("DD-MM-YYYY");

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
  );

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const settingWorkTime = moment.duration(setting[0].employee_worktime);
  const employeeWorkTime = moment.duration(currantData[0].productive_time);

  if (employeeWorkTime.asSeconds() < settingWorkTime.asSeconds()) {
    return res
      .status(200)
      .json({ EarlyClockOut: true, WorkingTime: setting[0].employee_worktime });
  }

  // start controller
  const currentTimeISO = new Date().toISOString();
  const ClcokOut = moment().format("hh:mm:ss A");

  if (currantData.length > 0) {
    // set LastOutTime
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    currantData[0].all_time =
      typeof currantData[0].all_time === "string"
        ? JSON.parse(currantData[0].all_time)
        : currantData[0].all_time;
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
      currentTimeISO;
    //  set ip addrerss
    currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip;

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

    currantData[0].all_time.push({
      intime: "",
      status: "",
      outtime: currentTimeISO,
      InTimeIP: "",
      OutTimeIP: "",
    });

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

router.post("/clockmissing/:id", async (req, res) => {
  // *****************functions *******************************

  // console.log(req.body);

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

  // 24hour to 12hur convert

  let time24 = req.body.clockOutTime; // "23:14"
  let hour = parseInt(time24.split(":")[0], 10);
  let minute = time24.split(":")[1];
  let period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;
  let formattedTime =
    (hour < 10 ? "0" + hour : hour) + ":" + minute + ":" + "00" + period;

  //  24hiur to 12hur convert

  // normal to ISOstring
  let time = req.body.clockOutTime;
  let Olddate = req.body.lastdaydate;

  let [day, month, year] = Olddate.split("-");
  let isoDateStr = `${year}-${month}-${day}T${time}:00`;

  let isoString = new Date(isoDateStr).toISOString();

  // normal to ISOstring

  // start controller
  const date = req.body.lastdaydate;
  const currentTimeISO = isoString;
  const ClcokOut = formattedTime; // accurate current time
  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
  );

  if (currantData.length > 0) {
    // set LastOutTime
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    currantData[0].all_time =
      typeof currantData[0].all_time === "string"
        ? JSON.parse(currantData[0].all_time)
        : currantData[0].all_time;
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
      currentTimeISO;
    //  set ip addrerss
    currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip;

    //  set Break Time and Productive Time

    let breakTime =
      currantData[0].break_time === "" ? "00:00:00" : currantData[0].break_time;
    let productiveTime =
      currantData[0].productive_time === ""
        ? "00:00:00"
        : currantData[0].productive_time;

    const lastEntry =
      currantData[0].all_time[currantData[0].all_time.length - 1];
    if (lastEntry.status === 1) {
      let difrence = getTimeDifference(lastEntry.intime, currentTimeISO);
      // console.log(difrence);
      productiveTime = sumTime(productiveTime, difrence);
      // console.log("productiveTime", productiveTime);
    } else if (lastEntry.status === 2) {
      let difrence = getTimeDifference(lastEntry.intime, currentTimeISO);
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

    currantData[0].all_time.push({
      intime: "",
      status: "",
      outtime: currentTimeISO,
      InTimeIP: "",
      OutTimeIP: "",
    });

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
     }',
     attendens_status='${"C"}'`,
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
    setting,
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

  const missingDates = await Promise.all(
    getDateRange(startleave, endleave).map(async (val) => {
      const datedayfind = val.split("-").reverse().join("-");
      const dateObj = new Date(datedayfind);
      const dayName = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });
      console.log(dayName, "Date", dateObj);

      const weekendDay = await DataFind(
        `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
      );

      if (weekendDay.length > 0) {
        let weekEnds = weekendDay[0].weeks.split(",").map(Number);
        const dayCount = Math.ceil(dateObj.getUTCDate() / 7);
        console.log(dayCount);

        if (weekEnds.includes(dayCount)) {
          console.log("Weekend day, skipping:", val);
          return "weekend";
        }
      }
      return val;
    })
  );

  let dateArray = getDateRange(startleave, endleave);
  let total_days = dateArray.length;
  console.log("total_days", total_days);

  const resons = await DataInsert(
    `tbl_leave_resons`,
    `start_date,end_date,leave_resone,leave_attachment,leave_type,leave_status,emp_Id,innsert_date,total_days`,
    `'${startleave}','${endleave === "" ? startleave : endleave}','${
      req.body.reason
    }','${JSON.stringify(
      (req.files?.attachment === undefined ? [] : req.files?.attachment).map(
        (val) => val.filename
      )
    )}', '${req.body.leavetype}','${"Pending"}','${
      req.params.id
    }','${new Date().toISOString()}','${total_days}'`,
    req.hostname,
    req.protocol
  );

  if (resons == -1) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }

     missingDates.map(async (val, i) => {
    const leavedate = val; 
  
    if (leavedate !== "weekend"){
      let leaverequt = await DataFind(`SELECT * FROM tbl_leave_resons WHERE start_date = '${val}' AND emp_Id='${req.params.id}'`)

     let leaveDates = []
    if(leaverequt.length>0){
      const date2 = moment(leaverequt[0].start_date, "DD-MM-YYYY");
      const date1 = moment(leaverequt[0].end_date, "DD-MM-YYYY");
      const diffDays = date1.diff(date2, "days");
      for (let i = 0; i <= diffDays; i++) {
        leaveDates.push(
          moment(date2, "DD-MM-YYYY")
            .add(i, "days")
            .format("DD-MM-YYYY")
        );
      }
    }
  
    leaveDates.map(async(val)=>{
      const result = await DataInsert(
        `tbl_employee_attndence`,
        `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id, leave_status`,
        `'${
          req.params.id
        }', '${val}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${
          leaverequt[0].id
        }','${leaverequt[0].leave_status}'`,
        req.hostname,
        req.protocol
      );

      if (result == -1) {
        req.flash("errors", process.env.dataerror);
        return res.redirect("/valid_license");
      }

    })

      const result = await DataInsert(
        `tbl_employee_attndence`,
        `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id, leave_status`,
        `'${
          req.params.id
        }', '${leavedate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${
          resons.insertId
        }','${"Pending"}'`,
        req.hostname,
        req.protocol
      );

      if (result == -1) {
        req.flash("errors", process.env.dataerror);
        return res.redirect("/valid_license");
      }

    }else{

      let CurrantEntry = moment().format("DD-MM-YYYY");
      if (CurrantEntry !== dateArray[i]) {
        const result = await DataInsert(
          `tbl_employee_attndence`,
          `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
          `'${req.params.id}', '${
            dateArray[i]
          }', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '${"-"}'`,
          req.hostname,
          req.protocol
        );

        if (result == -1) {
          req.flash("errors", process.env.dataerror);
          return res.redirect("/valid_license");
        }
      } else {
        return res
          .status(200)
          .json({ error_msg: "Today is weekend, you did not clock in" });
      }

    }
  });
  res.redirect("/employee/dashboard");
});




router.post("/leaverequst/:id", UploadRosone, async (req, res) => {
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

  let dateArray = getDateRange(startleave, endleave);
  let total_days = dateArray.length;
  console.log("total_days", total_days);

  const resons = await DataInsert(
    `tbl_leave_resons`,
    `start_date,end_date,leave_resone,leave_attachment,leave_type,leave_status,emp_Id,innsert_date,total_days`,
    `'${startleave}','${endleave === "" ? startleave : endleave}','${
      req.body.reason
    }','${JSON.stringify(
      (req.files?.attachment === undefined ? [] : req.files?.attachment).map(
        (val) => val.filename
      )
    )}', '${req.body.leavetype}','${"Pending"}','${
      req.params.id
    }','${new Date().toISOString()}','${total_days}'`,
    req.hostname,
    req.protocol
  );

  if (resons == -1) {
    req.flash("errors", process.env.dataerror);
    return res.redirect("/valid_license");
  }














  res.redirect("/employee/dashboard");
});

router.get("/entry/:id", async (req, res) => {
  const { employee, role } = req.user;
  const userData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE id=${req.params.id}`
  );
  userData[0].all_time =
    typeof userData[0].all_time === "string"
      ? JSON.parse(userData[0].all_time)
      : userData[0].all_time;

  //*******************  function  ******************
  function timeDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end)) {
      return "Invalid date format";
    }
    const timeDiff = Math.abs(end - start);
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
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
    if (val !== "Invalid date format") {
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
    if (val !== "Invalid date format") {
      TotalBreakTime = sumTime(TotalBreakTime, val);
    }
  });

  // console.log("TotalBreakTime", TotalBreakTime);
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  console.log(Allentrys);

  res.render("entryList", {
    employee,
    role,
    Allentrys: Allentrys,
    totalTime: filterTime,
    TotalWorkingTime,
    TotalBreakTime,
    ClockIn: userData[0].clockIn_time,
    ClockOut:
      userData[0].clockOut_time === "" ? "00:00:00" : userData[0].clockOut_time,
    date: userData[0].date,
    setting,
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

router.get("/account", async (req, res) => {
  const { employee, role } = req.user;
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const proDetails = await DataFind(
    `SELECT * FROM employee WHERE id=${employee.id}`
  );
  console.log("proDetails", proDetails);

  res.render("emProfile", { role, employee, proDetails, setting });
});

router.get("/hiddenChange/:id", async (req, res) => {
  try {
    const { employee, role } = req.user;
    const id = req.params.id;

    const employeedetails = await DataFind(
      `SELECT * FROM employee WHERE id=${id}`
    );
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

    const lastEntry =
      employeeData[0].all_time[employeeData[0].all_time.length - 1];
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
      Break: breakTime === "" ? "00:00:00" : breakTime,
      Working: productiveTime === "" ? "00:00:00" : productiveTime,
      status: lastEntry.status === 1 ? "true" : "false",
    });
  } catch (error) {
    console.error("Error in /hiddenChange/:id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/leaverequst/", async (req, res) => {
  const { employee, role } = req.user;
  const setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  let leaveType = await DataFind(
    `SELECT * FROM tbl_type_setting WHERE type_name="leaveType" AND status="active"`
  );
  let attendDate = await DataFind(
    `SELECT * FROM tbl_leave_resons WHERE emp_Id='${employee.id}'`
  );

  console.log(attendDate);

  attendDate = attendDate.map((item) => {
    try {
      item.leave_attachment = JSON.parse(item.leave_attachment || "[]");
    } catch (e) {
      item.leave_attachment = [];
    }
    return item;
  });

  res.render("leveResoneEm", {
    employee,
    role,
    setting,
    attendDate,
    leaveType,
  });
});

router.post("/erlyclockOut/:id", async (req, res) => {
  console.log(req.body);
  console.log(req.params.id);

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
  const ClcokOut = moment().format("hh:mm:ss A");
  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence  WHERE emplyeeId = '${req.params.id}' AND date='${date}'`
  );

  if (currantData.length > 0) {
    // set LastOutTime
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    currantData[0].all_time =
      typeof currantData[0].all_time === "string"
        ? JSON.parse(currantData[0].all_time)
        : currantData[0].all_time;
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
      currentTimeISO;
    //  set ip addrerss
    currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip;
    currantData[0].all_time[currantData[0].all_time.length - 1].comment =
      req.body.erlyreson;
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

    currantData[0].all_time.push({
      intime: "",
      status: "",
      outtime: currentTimeISO,
      InTimeIP: "",
      OutTimeIP: "",
    });

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

router.post("/breackover/:id", async (req, res) => {
  let date = moment().format("DD-MM-YYYY");
  let currantData = [];
  try {
    currantData = await DataFind(
      `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
    );
  } catch (err) {
    return res.status(200).json({ error: "Error fetching currantData" }, err);
  }

  if (currantData.length > 0 && currantData[0].clockOut_time === "") {
    currantData[0].all_time =
      typeof currantData[0].all_time === "string"
        ? JSON.parse(currantData[0].all_time)
        : currantData[0].all_time;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const all_time = currantData[0].all_time;
    let lastStatus = all_time[all_time.length - 1].status;

    if (lastStatus !== "") {
      all_time[all_time.length - 1].outtime = new Date().toISOString();
      all_time[all_time.length - 1].OutTimeIP = ip;
      let status = lastStatus === 1 ? 2 : 1;
      all_time.push({
        intime: new Date().toISOString(),
        status,
        outtime: "",
        InTimeIP: ip,
        OutTimeIP: "",
        comment: req.body.breakreason,
      });
    } else {
      all_time.push({
        intime: new Date().toISOString(),
        status: 1,
        outtime: "",
        InTimeIP: ip,
        OutTimeIP: "",
      });
    }

    // Working Time & Break Time
    const WorkingTime = all_time.filter((t) => t.status === 1);
    const BreakTime = all_time.filter((t) => t.status === 2);

    const calculateDuration = (arr) => {
      return arr.reduce((acc, val) => {
        let start = moment(val.intime),
          end = moment(val.outtime);
        if (start.isValid() && end.isValid()) {
          acc.add(moment.duration(end.diff(start)));
        }
        return acc;
      }, moment.duration());
    };

    let workDur = calculateDuration(WorkingTime);
    let breakDur = calculateDuration(BreakTime);

    let ProductiveTime = `${Math.floor(
      workDur.asHours()
    )}:${workDur.minutes()}:${workDur.seconds()}`;
    let totalBreakTime = `${Math.floor(
      breakDur.asHours()
    )}:${breakDur.minutes()}:${breakDur.seconds()}`;
    let clockIn_ip =
      all_time[all_time.length - 1].status === 1
        ? ip
        : currantData[0].clockIn_ip;
    try {
      const updated = await DataUpdate(
        `
          tbl_employee_attndence `,
        `all_time='${JSON.stringify(
          all_time
        )}',productive_time='${ProductiveTime}',break_time='${totalBreakTime}', clockIn_Ip='${clockIn_ip}'`,
        `emplyeeId = '${req.params.id}' AND date='${date}'`,
        req.hostname,
        req.protocol
      );

      if (updated === -1) throw new Error("Failed to update data");

      return res.redirect("/employee/dashboard");
    } catch (err) {
      return res
        .status(200)
        .json({ error: "Error updating working/break time" });
    }
  }
});

module.exports = router;
