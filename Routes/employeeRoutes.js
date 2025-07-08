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
const { parse } = require("path");

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

    let MissOut = false;
    if (OldData.length > 0) {
      if (OldData[OldData.length - 1].clockOut_time === "") {
        MissOut = true;
        if (
          OldData[OldData.length - 1].all_time[
            OldData[OldData.length - 1].all_time.length - 1
          ].status === 2
        ) {
          let BreakEntry =
            OldData[OldData.length - 1].all_time[
              OldData[OldData.length - 1].all_time.length - 1
            ];

          return res.send({
            Break: "00:00:00",
            WorkingTime: "00:00:00",
            MissingBreakOut: MissOut,
            BreakOutEntry: BreakEntry,
          });
        }
        return res.send({
          Break: "00:00:00",
          WorkingTime: "00:00:00",
          MissingClockOut: MissOut,
          OldData: OldData[OldData.length - 1],
        });
      }
    }
    // ************** Missing ClockOut Condition *************

    let lastDate = "";

    if (OldData.length > 0) {
      OldData.sort((a, b) => new Date(a.date) - new Date(b.date));
      lastDate = OldData[OldData.length - 1].date;
    }

    let currentDate = moment(lastDate, "DD-MM-YYYY").add(1, "days");
    console.log("currentDate", currentDate);

    let leaveVerify = [];
    while (true) {
      const formattedDate = currentDate.format("DD-MM-YYYY");
      const leaves = await DataFind(
        `SELECT * FROM tbl_leave_resons WHERE emp_Id = '${req.params.id}' AND start_date = '${formattedDate}'`
      );
      leaveVerify.push(leaves[0]);
      if (leaves && leaves.length > 0) {
        currentDate.add(1, "days");
      } else {
        break;
      }
    }
    console.log("leaveVerify", leaveVerify);

    let processedDates = [];
    let date2 = "";
    let date1 = "";
    let diffDays = "";
    if (leaveVerify.length > 0) {
      for (let i = 0; i < leaveVerify.length - 1; i++) {
        const leavedate2 = moment(leaveVerify[i].start_date, "DD-MM-YYYY");
        const leavedate1 = moment(leaveVerify[i].end_date, "DD-MM-YYYY");
        const leavediffDays = leavedate1.diff(leavedate2, "days");

        let leaveDate = [leaveVerify[i].start_date];
        console.log("leaveDate", leaveDate);

        for (let i = 0; i < leavediffDays; i++) {
          leaveDate.push(
            moment(leaveDate[i], "DD-MM-YYYY")
              .add(1, "days")
              .format("DD-MM-YYYY")
          );
        }

        // weekends verify in leave

        const finalLeaveDates = await Promise.all(
          leaveDate.map(async (val) => {
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
              return val;
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
        console.log("finalLeaveDates", finalLeaveDates);
   for(let i=0 ;i<finalLeaveDates.length;i++){
        // finalLeaveDates.forEach(async (val, i) => {
          let val = finalLeaveDates[i]
          lastDate = leaveDate[i];
          if (val !== "weekend") {
            let CurrantEntry = moment().format("DD-MM-YYYY");
            console.log("leaveDate[i]", leaveDate[i]);

            if (CurrantEntry !== leaveDate[i]) {
              const matchingLeave = leaveVerify.find((leave) => {
                if (!leave || !leave.start_date || !leave.end_date)
                  return false;
                const start = moment(leave.start_date, "DD-MM-YYYY");
                const end = moment(leave.end_date, "DD-MM-YYYY");
                const current = moment(leaveDate[i], "DD-MM-YYYY");
                return (
                  current.isSameOrAfter(start) && current.isSameOrBefore(end)
                );
              });

              const leaveId = matchingLeave ? matchingLeave.id : "-";
              const leaveStatus = matchingLeave
                ? matchingLeave.leave_status
                : "-";

              const result = await DataInsert(
                `tbl_employee_attndence`,
                `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id,leave_status`,
                `'${req.params.id}', '${leaveDate[i]}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${leaveId}','${leaveStatus}'`,
                req.hostname,
                req.protocol
              );

              if (result == -1) {
                req.flash("errors", process.env.dataerror);
                return res.redirect("/valid_license");
              }
            }
          } else if (val === "weekend") {
            let CurrantEntry = moment().format("DD-MM-YYYY");
            if (CurrantEntry !== leaveDate[i]) {
              const result = await DataInsert(
                `tbl_employee_attndence`,
                `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
                `'${req.params.id}', '${
                  leaveDate[i]
                }', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '${"-"}'`,
                req.hostname,
                req.protocol
              );

              if (result == -1) {
                req.flash("errors", process.env.dataerror);
                return res.redirect("/valid_license");
              }
            }
          }

          let CurrantEntry = moment().format("DD-MM-YYYY");
          if (val !== CurrantEntry) {
            processedDates.push(val);
          }
        // });
        }
      }
      date2 = moment(lastDate, "DD-MM-YYYY");
      date1 = moment(date, "DD-MM-YYYY");
      diffDays = date1.diff(date2, "days");
    } else {
      date2 = moment(lastDate, "DD-MM-YYYY");
      date1 = moment(date, "DD-MM-YYYY");
      diffDays = date1.diff(date2, "days");
    }

    let validateCode =
      processedDates.length > 0 ? processedDates.length : diffDays - 1;

    if (validateCode > 0) {
      // weekEnd Inssert Data
      let lastweeekend = "";
      let currantdate = "";
      let DatesArr = [];
      let NextDateDay = "";

      lastweeekend = moment(lastDate, "DD-MM-YYYY");

      currantdate = moment(date, "DD-MM-YYYY");
      DatesArr = [];
      NextDateDay = lastweeekend.clone().add(1, "days");

      if (NextDateDay !== "") {
        while (NextDateDay.isSameOrBefore(currantdate)) {
          DatesArr.push(NextDateDay.format("DD-MM-YYYY"));
          NextDateDay.add(1, "days");
        }
      }

      const missingDatesWeekend = await Promise.all(
        DatesArr.map(async (val) => {
          try {
            const [dd, mm, yyyy] = val.split("-");
            const dateStr = `${dd}-${mm}-${yyyy}`;

            const momentDate = moment.tz(dateStr, "DD-MM-YYYY", "Asia/Kolkata");
            if (!momentDate.isValid()) {
              console.warn(`Invalid date: ${val}`);
              return val;
            }

            const dayName = momentDate.format("dddd");

            const weekendDay = await DataFind(
              `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
            );

            if (weekendDay.length > 0) {
              const weekEnds = weekendDay[0].weeks.split(",").map(Number);

              const dateOfMonth = momentDate.date();
              const weekOfMonth = Math.ceil(dateOfMonth / 7);

              if (weekEnds.includes(weekOfMonth)) {
                return "weekend";
              }
            }

            return val;
          } catch (err) {
            console.error("Weekend check error for date:", val, err);
            return val;
          }
        })
      );

      let weekendsInsertedDatas = false;
      let processedDatesAfterweek = [];

      console.log("missingDatesWeekend", missingDatesWeekend);

      for (let i = 0; i < missingDatesWeekend.length; i++) {
        const val = missingDatesWeekend[i];
        const insertDate = DatesArr[i];
        const today = moment().format("DD-MM-YYYY");

        if (val === "weekend" && !weekendsInsertedDatas) {
          if (insertDate !== today) {
            const result = await DataInsert(
              `tbl_employee_attndence`,
              `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
              `'${req.params.id}', '${insertDate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '-'`,
              req.hostname,
              req.protocol
            );

            if (result === -1) {
              req.flash("errors", process.env.dataerror);
              return res.redirect("/valid_license");
            }
          }
        } else if (val !== "weekend") {
          weekendsInsertedDatas = true;
        }

        let CurrantEntry = moment().format("DD-MM-YYYY");
        if (val !== CurrantEntry && weekendsInsertedDatas) {
          processedDatesAfterweek.push(val);
        }
      }
      console.log(processedDatesAfterweek);

      let currentDate = moment(processedDatesAfterweek[0], "DD-MM-YYYY");

      let leaveVerify = [];
      while (true) {
        console.log(currentDate);

        const formattedDate = currentDate.format("DD-MM-YYYY");
        const leaves = await DataFind(
          `SELECT * FROM tbl_leave_resons WHERE emp_Id = '${req.params.id}' AND start_date = '${formattedDate}'`
        );
        leaveVerify.push(leaves[0]);
        if (leaves && leaves.length > 0) {
          currentDate.add(1, "days");
        } else {
          break;
        }
      }
      console.log("leaveVerify2", leaveVerify);

     if (leaveVerify.length > 0) {
  let allFinalLeaveDates = [];

  for (let i = 0; i < leaveVerify.length - 1; i++) {
    const leavedate2 = moment(leaveVerify[i].start_date, "DD-MM-YYYY");
    const leavedate1 = moment(leaveVerify[i].end_date, "DD-MM-YYYY");
    const leavediffDays = leavedate1.diff(leavedate2, "days");

    let leaveDate = [leaveVerify[i].start_date];
    for (let j = 0; j < leavediffDays; j++) {
      leaveDate.push(
        moment(leaveDate[j], "DD-MM-YYYY").add(1, "days").format("DD-MM-YYYY")
      );
    }

    // Check for weekend in each leaveDate
    const finalLeaveDates = await Promise.all(
      leaveDate.map(async (val) => {
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
          return val;
        }

        if (weekendDay.length > 0) {
          const weekEnds = weekendDay[0].weeks.split(",").map(Number);
          const dayCount = Math.ceil(dateObj.getUTCDate() / 7);
          if (weekEnds.includes(dayCount)) {
            return "weekend";
          }
        }

        return val;
      })
    );

    
    allFinalLeaveDates.push(...finalLeaveDates);

    for (let k = 0; k < finalLeaveDates.length; k++) {
      const val = finalLeaveDates[k];
      const leaveVal = leaveDate[k];
      const CurrantEntry = moment().format("DD-MM-YYYY");

      if (val !== "weekend") {
        if (CurrantEntry !== leaveVal) {
          const matchingLeave = leaveVerify.find((leave) => {
            if (!leave || !leave.start_date || !leave.end_date) return false;
            const start = moment(leave.start_date, "DD-MM-YYYY");
            const end = moment(leave.end_date, "DD-MM-YYYY");
            const current = moment(leaveVal, "DD-MM-YYYY");
            return (
              current.isSameOrAfter(start) && current.isSameOrBefore(end)
            );
          });

          const leaveId = matchingLeave ? matchingLeave.id : "-";
          const leaveStatus = matchingLeave
            ? matchingLeave.leave_status
            : "-";

          const result = await DataInsert(
            `tbl_employee_attndence`,
            `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id,leave_status`,
            `'${req.params.id}', '${leaveVal}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${leaveId}','${leaveStatus}'`,
            req.hostname,
            req.protocol
          );

          if (result == -1) {
            req.flash("errors", process.env.dataerror);
            return res.redirect("/valid_license");
          }
        }
      } else {
        if (CurrantEntry !== leaveVal) {
          const result = await DataInsert(
            `tbl_employee_attndence`,
            `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
            `'${req.params.id}', '${leaveVal}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '-'`,
            req.hostname,
            req.protocol
          );

          if (result == -1) {
            req.flash("errors", process.env.dataerror);
            return res.redirect("/valid_license");
          }
        }
      }
    }
  }

 
  processedDatesAfterweek = processedDatesAfterweek.filter(
    (val) => !allFinalLeaveDates.map((d) => d.trim()).includes(val.trim())
  );

  console.log("processedDatesAfterweek", processedDatesAfterweek);

  if (processedDatesAfterweek.length > 0) {
    date2 = moment(processedDatesAfterweek[0], "DD-MM-YYYY");
    date1 = moment(date, "DD-MM-YYYY");
    diffDays = date1.diff(date2, "days");
  } else {
    diffDays = 0;
  }
}else {
        if (processedDatesAfterweek.length > 0) {
          date2 = moment(processedDatesAfterweek[0], "DD-MM-YYYY");
          date1 = moment(date, "DD-MM-YYYY");
          diffDays = date1.diff(date2, "days");
        } else {
          diffDays = 0;
        }
      }

      // conditions  Break

      if (diffDays > 0) {
        let dateArray = [];

        while (date2.isSameOrBefore(date1)) {
          dateArray.push(date2.format("DD-MM-YYYY"));
          date2.add(1, "days");
        }

        const missingDates = await Promise.all(
          dateArray.map(async (val) => {
            try {
              const [dd, mm, yyyy] = val.split("-");
              const dateStr = `${dd}-${mm}-${yyyy}`;

              const momentDate = moment.tz(
                dateStr,
                "DD-MM-YYYY",
                "Asia/Kolkata"
              );
              if (!momentDate.isValid()) {
                console.warn(`Invalid date: ${val}`);
                return val;
              }

              const dayName = momentDate.format("dddd");

              const weekendDay = await DataFind(
                `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
              );

              if (weekendDay.length > 0) {
                const weekEnds = weekendDay[0].weeks.split(",").map(Number);

                const dateOfMonth = momentDate.date();
                const weekOfMonth = Math.ceil(dateOfMonth / 7);

                if (weekEnds.includes(weekOfMonth)) {
                  return "weekend";
                }
              }

              return val;
            } catch (err) {
              console.error("Weekend check error for date:", val, err);
              return val;
            }
          })
        );

        let weekendsInserted = false;
        let processedDates = [];

        console.log("missingDates", missingDates);

        for (let i = 0; i < missingDates.length; i++) {
          const val = missingDates[i];
          const insertDate = DatesArr[i];
          const today = moment().format("DD-MM-YYYY");

          if (val === "weekend" && !weekendsInserted) {
            if (insertDate !== today) {
              const result = await DataInsert(
                `tbl_employee_attndence`,
                `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
                `'${req.params.id}', '${insertDate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '-'`,
                req.hostname,
                req.protocol
              );

              if (result === -1) {
                req.flash("errors", process.env.dataerror);
                return res.redirect("/valid_license");
              }
            }
          } else if (val !== "weekend") {
            weekendsInserted = true;
          }

          let CurrantEntry = moment().format("DD-MM-YYYY");
          if (val !== CurrantEntry && weekendsInserted) {
            processedDates.push(val);
          }
        }

        let firstDates = [];

        for (let val of dateArray) {
          if (val !== moment().format("DD-MM-YYYY")) {
            firstDates.push(val);
          }
        }

        if (processedDates.length <= 0) {
          // let LastEntry = [];
          // try {
          //   LastEntry = await DataFind(
          //     `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
          //   );
          // } catch (err) {
          //   return res
          //     .status(200)
          //     .json({ error: "Error fetching old attendance data" });
          // }

          // const date2 = moment(
          //   LastEntry[LastEntry.length - 1].date,
          //   "DD-MM-YYYY"
          // );
          // const date1 = moment(date, "DD-MM-YYYY");
          // const diffDays = date1.diff(date2, "days");

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
            MissingDates: true,
            firstDates: firstDates,
          });
        }
        return res.status(200).json({
          Break: "00:00:00",
          WorkingTime: "00:00:00",
          MissingDates: processedDates,
          firstDates: firstDates,
        });
      }

      if (processedDatesAfterweek.length <= 0) {
        // let LastEntry = [];
        // try {
        //   LastEntry = await DataFind(
        //     `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date!='${date}'`
        //   );
        // } catch (err) {
        //   return res
        //     .status(200)
        //     .json({ error: "Error fetching old attendance data" });
        // }

        // const date2 = moment(
        //   LastEntry[LastEntry.length - 1].date,
        //   "DD-MM-YYYY"
        // );
        // const date1 = moment(date, "DD-MM-YYYY");
        // const diffDays = date1.diff(date2, "days");

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
          MissingDates: true,
        });
      }
      // conditions Break

      return res.status(200).json({
        Break: "00:00:00",
        WorkingTime: "00:00:00",
        MissingDates: processedDatesAfterweek,
        WeekendVerify: missingDatesWeekend,
      });
    } else if (currantData.length > 0 && currantData[0].clockOut_time === "") {
      const parsedAllTime = JSON.parse(currantData[0].all_time);

      const BarakCheak = parsedAllTime[parsedAllTime.length - 1].status;

      if (BarakCheak === 1) {
        let BreakTime = moment.duration(currantData[0].break_time).asSeconds();
        let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
        let hostsetBreack = moment.duration(setting[0].break_time).asSeconds();

        if (hostsetBreack < BreakTime) {
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
          )}',clockOut_time='',clockOut_ip='', extra_time='', total_time='', attendens_status='P'`,
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

  const clockInTime = JSON.parse(currantData[0].all_time);
  let totalDurationMs = 0;
  const now = moment();

  clockInTime.forEach((entry) => {
    if (entry.status === 1 && entry.intime) {
      const inTime = moment(entry.intime);
      let outTime;

      if (entry.outtime) {
        outTime = moment(entry.outtime);
      } else {
        outTime = now;
      }

      const duration = outTime.diff(inTime);
      totalDurationMs += duration;
    }
  });

  const totalDuration = moment.duration(totalDurationMs);

  const hours = String(Math.floor(totalDuration.asHours())).padStart(2, "0");
  const minutes = String(totalDuration.minutes()).padStart(2, "0");
  const seconds = String(totalDuration.seconds()).padStart(2, "0");

  let finaleTime = `${hours}:${minutes}:${seconds}`;

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  const settingWorkTime = moment.duration(setting[0].employee_worktime);
  const employeeWorkTime = moment.duration(finaleTime);

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

    const safeTime = (time) =>
      time && typeof time === "string" && time.includes(":")
        ? time
        : "00:00:00";
    let breakTime = safeTime(currantData[0].break_time);
    let productiveTime = safeTime(currantData[0].productive_time);

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

  let time = req.body.clockOutTime; // e.g. "23:14"
  let Olddate = req.body.lastdaydate; // e.g. "11-06-2025"

  // Convert to 'YYYY-MM-DDTHH:mm:ss' format with Asia/Kolkata
  let [day, month, year] = Olddate.split("-");
  let combinedDateTime = `${year}-${month}-${day} ${time}:00`;

  // Convert to ISO with Asia/Kolkata timezone
  let istMoment = moment.tz(
    combinedDateTime,
    "YYYY-MM-DD HH:mm:ss",
    "Asia/Kolkata"
  );
  let isoString = istMoment.toISOString();

  // console.log("🕒 IST Moment:", istMoment.format());
  // console.log("🕒 ISO String in IST:", isoString);
  // normal to ISOstring

  // start controller
  const date = req.body.lastdaydate;
  const ClcokOut = moment(isoString).format("hh:mm A");

  // accurate current time
  // console.log("ClcokOut", ClcokOut);
  // console.log("currentTimeISO", currentTimeISO);

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${date}'`
  );
  // console.log("currantData", currantData);

  if (currantData.length > 0) {
    // set LastOutTime
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    currantData[0].all_time =
      typeof currantData[0].all_time === "string"
        ? JSON.parse(currantData[0].all_time)
        : currantData[0].all_time;
    currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
      isoString;
    //  set ip addrerss
    currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip;

    //  set Break Time and Productive Time
    const safeTime = (time) =>
      time && typeof time === "string" && time.includes(":")
        ? time
        : "00:00:00";
    let breakTime = safeTime(currantData[0].break_time);
    let productiveTime = safeTime(currantData[0].productive_time);

    const lastEntry =
      currantData[0].all_time[currantData[0].all_time.length - 1];
    if (lastEntry.status === 1) {
      let difrence = getTimeDifference(lastEntry.intime, isoString);
      // console.log(difrence);
      productiveTime = sumTime(productiveTime, difrence);
      // console.log("productiveTime", productiveTime);
    } else if (lastEntry.status === 2) {
      let difrence = getTimeDifference(lastEntry.intime, isoString);
      console.log(difrence);
      breakTime = sumTime(breakTime, difrence);
      // console.log("breakTime", breakTime);
    }
    // console.log("productiveTime", productiveTime);
    // console.log("breakTime", breakTime);

    //  set Total Time

    let total_time = sumTime(productiveTime, breakTime);
    // console.log("total_time",total_time);

    // set Extra Time
    const settingData = await DataFind("SELECT * FROM tbl_setting LIMIT 1");
    const MinimumTime = hmsToSeconds(settingData[0].employee_worktime);
    const ProductiveTimesecons = hmsToSeconds(productiveTime);

    let extra_time = secondsToHMS(ProductiveTimesecons - MinimumTime);
    // console.log("extra_time",extra_time);

    currantData[0].all_time.push({
      intime: "",
      status: "",
      outtime: isoString,
      InTimeIP: "",
      OutTimeIP: "",
    });

    let attend_statusCode =
      currantData[0].attendens_status !== "BO"
        ? "C"
        : currantData[0].attendens_status;

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
       attendens_status='${attend_statusCode}'`,
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
  let employeeName = await DataFind(
    `SELECT * FROM employee  WHERE id='${employee.id}'`
  );

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${employee.id}' ORDER BY id DESC`
  );
  console.log(employee);

  const Absent = await DataFind(`
  SELECT COUNT(attendens_status) AS total_absent
  FROM tbl_employee_attndence 
  WHERE 
    attendens_status = 'A' 
    AND emplyeeId = '${employee.id}'
    AND MONTH(STR_TO_DATE(date, '%d-%m-%Y')) = MONTH(CURDATE())
    AND YEAR(STR_TO_DATE(date, '%d-%m-%Y')) = YEAR(CURDATE())
`);

  // console.log("Absent", Absent[0].total_absent);

  const Present = await DataFind(`
   SELECT COUNT(attendens_status) AS total_precent
   FROM tbl_employee_attndence WHERE (attendens_status = 'P' OR attendens_status = 'C' OR attendens_status = 'EC' OR attendens_status = 'BO') AND emplyeeId='${employee.id}'AND MONTH(STR_TO_DATE(date, '%d-%m-%Y')) = MONTH(CURDATE())
    AND YEAR(STR_TO_DATE(date, '%d-%m-%Y')) = YEAR(CURDATE())`);
  // console.log("Present", Present[0].total_precent);

  const WorkingTime = await DataFind(`
   SELECT 
  SEC_TO_TIME(SUM(TIME_TO_SEC(productive_time))) AS total_productive_time
FROM 
  tbl_employee_attndence 
WHERE 
  emplyeeId = '${employee.id}' 
  AND MONTH(STR_TO_DATE(date, '%d-%m-%Y')) = MONTH(CURDATE())
  AND YEAR(STR_TO_DATE(date, '%d-%m-%Y')) = YEAR(CURDATE());`);

  // console.log("WorkingTime", WorkingTime[0].total_productive_time);

  const BreackTime = await DataFind(`
   SELECT 
  SEC_TO_TIME(SUM(TIME_TO_SEC(break_time))) AS total_break_time
FROM 
  tbl_employee_attndence 
WHERE 
  emplyeeId = '${employee.id}' 
  AND MONTH(STR_TO_DATE(date, '%d-%m-%Y')) = MONTH(CURDATE())
  AND YEAR(STR_TO_DATE(date, '%d-%m-%Y')) = YEAR(CURDATE());`);

  // console.log("BreackTime", BreackTime);

  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);

  res.render("attendlist", {
    role,
    employee,
    currantData,
    setting,
    employeeName: employeeName[0].firstName,
    Absent,
    Present,
    WorkingTime,
    BreackTime,
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    while (currentDate <= endDate) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");
      if (currentDate.getTime() !== today.getTime()) {
        result.push(`${dd}-${mm}-${yyyy}`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  function dateformat(date) {
    let formateer = date.split("/");
    return `${formateer[1]}-${formateer[0]}-${formateer[2]}`;
  }

  let startleave = req.body.satrtdate
    ? req.body.satrtdate.split("-").reverse().join("-")
    : dateformat(req.body.daterange.split("-")[0].trim());
  // let endleave = req.body.enddate.split("-").reverse().join("-");
  let endleave = req.body.daterange
    ? dateformat(req.body.daterange.split("-")[1].trim())
    : "";

  console.log("startleave", startleave);
  console.log("endleave", endleave);

  const missingDates = await Promise.all(
    getDateRange(startleave, endleave).map(async (val) => {
      try {
        const [dd, mm, yyyy] = val.split("-");
        const dateStr = `${dd}-${mm}-${yyyy}`;

        const momentDate = moment.tz(dateStr, "DD-MM-YYYY", "Asia/Kolkata");

        if (!momentDate.isValid()) {
          console.warn(`Invalid date: ${val}`);
          return val;
        }

        const dayName = momentDate.format("dddd");

        const weekendDay = await DataFind(
          `SELECT * FROM tbl_weekend WHERE days='${dayName}'`
        );

        if (weekendDay.length > 0) {
          const weekEnds = weekendDay[0].weeks.split(",").map(Number);

          const dateOfMonth = momentDate.date();
          const weekOfMonth = Math.ceil(dateOfMonth / 7);

          if (weekEnds.includes(weekOfMonth)) {
            console.log("Weekend day, skipping:", val);
            return "weekend";
          }
        }

        return val;
      } catch (err) {
        console.error("Weekend check error for date:", val, err);
        return val;
      }
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

  // missingDates.map(async (val, i) => {
  //   const leavedate = val;

  //   if (leavedate !== "weekend") {
  //     const result = await DataInsert(
  //       `tbl_employee_attndence`,
  //       `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id, leave_status`,
  //       `'${
  //         req.params.id
  //       }', '${leavedate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${
  //         resons.insertId
  //       }','${"Pending"}'`,
  //       req.hostname,
  //       req.protocol
  //     );

  //     if (result == -1) {
  //       req.flash("errors", process.env.dataerror);
  //       return res.redirect("/valid_license");
  //     }
  //   } else {
  //     let CurrantEntry = moment().format("DD-MM-YYYY");
  //     if (CurrantEntry !== dateArray[i]) {
  //       const result = await DataInsert(
  //         `tbl_employee_attndence`,
  //         `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
  //         `'${req.params.id}', '${
  //           dateArray[i]
  //         }', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '${"-"}'`,
  //         req.hostname,
  //         req.protocol
  //       );

  //       if (result == -1) {
  //         req.flash("errors", process.env.dataerror);
  //         return res.redirect("/valid_license");
  //       }
  //     } else {
  //       return res
  //         .status(200)
  //         .json({ error_msg: "Today is weekend, you did not clock in" });
  //     }
  //   }
  // });

  for (let i = 0; i < missingDates.length; i++) {
    const leavedate = missingDates[i];
    const insertDate = dateArray[i];
    const today = moment().format("DD-MM-YYYY");

    if (leavedate !== "weekend") {
      const result = await DataInsert(
        `tbl_employee_attndence`,
        `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id, leave_status`,
        `'${req.params.id}', '${leavedate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'FD', 'A', '${resons.insertId}', 'Pending'`,
        req.hostname,
        req.protocol
      );

      if (result === -1) {
        req.flash("errors", process.env.dataerror);
        return res.redirect("/valid_license");
      }
    } else {
      // Handle weekend case
      if (insertDate !== today) {
        const result = await DataInsert(
          `tbl_employee_attndence`,
          `emplyeeId, date, all_time, clockIn_time, clockOut_time, break_time, productive_time, extra_time, total_time, clockIn_ip, clockOut_ip, day_status, attendens_status, leave_resone_id`,
          `'${req.params.id}', '${insertDate}', '[]', '-', '-', '-', '-', '-', '-', '-', '-', 'WK', '-', '-'`,
          req.hostname,
          req.protocol
        );

        if (result === -1) {
          req.flash("errors", process.env.dataerror);
          return res.redirect("/valid_license");
        }
      } else {
        return res.status(200).json({
          error_msg: "Today is weekend, you did not clock in",
        });
      }
    }
  }

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

  const verify = await DataFind(
    `SELECT * FROM tbl_leave_resons WHERE emp_Id = '${req.params.id}' AND start_date='${startleave}' `
  );
  if (verify.length === 0) {
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
  }
  res.redirect("/employee/leaverequst");
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
  console.log("employee", req.user.admin);

  // console.log("TotalBreakTime", TotalBreakTime);
  let setting = await DataFind(`SELECT * FROM tbl_setting LIMIT 1`);
  let EmployeeName = await DataFind(
    `SELECT userName FROM employee WHERE id='${userData[0].emplyeeId}' `
  );

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
    EmployeeName: EmployeeName[0].userName,
  });
});

router.post("/workerList/:id", async (req, res) => {
  const employeeList = await DataFind(
    `SELECT   a.*, 
    s.break_time AS setting_break_time
  FROM 
    tbl_employee_attndence AS a
  JOIN 
     tbl_setting AS s  ON 1=1 WHERE emplyeeId = '${
       req.params.id
     }' AND date IN (${req.body.data
      .map((d) => `'${d}'`)
      .join(", ")}) ORDER BY id DESC`
  );

  const Absent = await DataFind(`
  SELECT COUNT(attendens_status) AS total_absent
  FROM tbl_employee_attndence 
  WHERE 
    attendens_status = 'A' 
    AND emplyeeId = '${req.params.id}'
    AND date IN (${req.body.data
      .map((d) => `'${d}'`)
      .join(", ")}) ORDER BY id DESC
`);

  // console.log("Absent", Absent[0].total_absent);

  const Present = await DataFind(`
   SELECT COUNT(attendens_status) AS total_precent
   FROM tbl_employee_attndence WHERE (attendens_status = 'P' OR attendens_status = 'C' OR attendens_status = 'EC' OR attendens_status = 'BO') AND emplyeeId='${
     req.params.id
   }'AND date IN (${req.body.data
    .map((d) => `'${d}'`)
    .join(", ")}) ORDER BY id DESC`);

  // console.log("Present", Present[0].total_precent);

  const WorkingTime = await DataFind(`
   SELECT 
  SEC_TO_TIME(SUM(TIME_TO_SEC(productive_time))) AS total_productive_time
FROM 
  tbl_employee_attndence 
WHERE 
  emplyeeId = '${req.params.id}' 
  AND date IN (${req.body.data
    .map((d) => `'${d}'`)
    .join(", ")}) ORDER BY id DESC`);

  // console.log("WorkingTime", WorkingTime[0].total_productive_time);

  const BreackTime = await DataFind(`
   SELECT 
  SEC_TO_TIME(SUM(TIME_TO_SEC(break_time))) AS total_break_time
FROM 
  tbl_employee_attndence 
WHERE 
  emplyeeId = '${req.params.id}' 
  AND date IN (${req.body.data
    .map((d) => `'${d}'`)
    .join(", ")}) ORDER BY id DESC`);

  // console.log(employeeList);
  res
    .status(200)
    .json({ employeeList, Absent, Present, WorkingTime, BreackTime });
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

  let validatReson = req.body.erlyreson?.trim();

  if (!validatReson || validatReson.length === 0) {
    req.flash("error_msg", "Early Clock Out reason is required.");
    return res.redirect("/employee/dashboard");
  }
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

    const safeTime = (time) =>
      time && typeof time === "string" && time.includes(":")
        ? time
        : "00:00:00";
    let breakTime = safeTime(currantData[0].break_time);
    let productiveTime = safeTime(currantData[0].productive_time);
    const currantTime = new Date().toISOString();

    const lastEntry =
      currantData[0].all_time[currantData[0].all_time.length - 1];
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
    console.log(total_time);

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
     }',attendens_status='EC'`,
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
        role: "US",
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

router.post("/breackOutMiss/:id", async (req, res) => {
  console.log(req.body);
  console.log(req.params.id);
  let breackInDate = req.body.breackInDate;
  let breakOutTime = req.body.breakOutTime;

  const currantData = await DataFind(
    `SELECT * FROM tbl_employee_attndence WHERE emplyeeId='${req.params.id}' AND date='${breackInDate}'`
  );

  // Convert to ISO
  const [day, month, year] = breackInDate.split("-").map(Number);
  const [hour, minute] = breakOutTime.split(":").map(Number);

  const localDate = new Date(year, month - 1, day, hour, minute);
  const isoString = localDate.toISOString();

  console.log("isoString", isoString);

  currantData[0].all_time =
    typeof currantData[0].all_time === "string"
      ? JSON.parse(currantData[0].all_time)
      : currantData[0].all_time;
  currantData[0].all_time[currantData[0].all_time.length - 1].outtime =
    isoString;
  currantData[0].all_time[currantData[0].all_time.length - 1].comment =
    req.body.breakoutreason;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  currantData[0].all_time[currantData[0].all_time.length - 1].OutTimeIP = ip;
  currantData[0].all_time[currantData[0].all_time.length - 1].role = "US";

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
  function sumTime(time1, time2) {
    const totalSeconds =
      timeStringToSeconds(time1) + timeStringToSeconds(time2);
    return secondsToTimeString(totalSeconds);
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
  const safeTime = (time) =>
    time && typeof time === "string" && time.includes(":") ? time : "00:00:00";

  let breakTime = safeTime(currantData[0].break_time);
  let productiveTime = safeTime(currantData[0].productive_time);

  const lastEntry = currantData[0].all_time[currantData[0].all_time.length - 1];
  if (lastEntry.status === 1) {
    let difrence = getTimeDifference(lastEntry.intime, lastEntry.outtime);
    console.log(difrence);
    productiveTime = sumTime(productiveTime, difrence);
    console.log("productiveTime", productiveTime);
  } else if (lastEntry.status === 2) {
    let difrence = getTimeDifference(lastEntry.intime, lastEntry.outtime);
    console.log(difrence);
    breakTime = sumTime(breakTime, difrence);
    console.log("breakTime", breakTime);
  }

  currantData[0].all_time.push({
    intime: isoString,
    status: 1,
    outtime: "",
    InTimeIP: ip,
    OutTimeIP: "",
  });

  const updated = await DataUpdate(
    `tbl_employee_attndence`,
    `all_time='${JSON.stringify(
      currantData[0].all_time
    )}', attendens_status='BO', break_time='${breakTime}', productive_time='${productiveTime}'`,
    `emplyeeId='${req.params.id}' AND date='${breackInDate}'`,
    req.hostname,
    req.protocol
  );

  if (updated === -1) throw new Error("Failed to update data");

  res.redirect("/employee/dashboard/");
});

module.exports = router;
