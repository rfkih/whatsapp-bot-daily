const router = require("express").Router();
const fs = require("fs");
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const Table = require("easy-table");
const moment = require('moment')
const { date } = require("./data");
const Excel = require("exceljs")


const libPath = "C:\\oracle\\instantclient_21_8";
const dbConfig = require("../config/dbconfig");

if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

let count = 0;

const test = async (message, type, number, changeDate) => {
  //    date(changeDate)
  const workbook = new Excel.Workbook();
  const dailyStmnts = date(changeDate, type);

  const checkStmnts = date(changeDate, type);
  // console.log(type);
  // console.log(number);
  const connection = await oracledb.getConnection(dbConfig);
  try {
    if (type === "check") {
      // console.log(checkStmnts[parseInt(number)]);
      const result = await connection.execute(checkStmnts[parseInt(number)]);
      //console.log(connection._inProgress);
      connection.release();
      // console.log(result.rows);
      const response = result.rows.map((val) => {
        if (number == "0") {
          return;
        }
        if (val?.CLS_BIT == null) {
          return {
            ...val,
            CLS_BIT: "Open",
          };
        } else if (val?.CLS_BIT.substring(0, 6) == "202020") {
          return {
            ...val,
            CLS_BIT: "Close",
          };
        } else {
          return {
            ...val,
            CLS_BIT: "On Progress",
          };
        }
      });

      if (number == "0") {
        const wamessage = result.rows[0].COUNT;

        const sendwa = `bfcount ${wamessage}, perkiraan waktu ${Math.ceil(
          wamessage / 5000
        )} menit`;

        message.reply(sendwa.toString());
        message.reply(Table.print(result.rows));
        return;
      } else {
        const waSend = Table.print(response);

        // console.log(Table.print(response));

        message.reply(waSend);
      }
    } else if (type === "daily") {
      let time = 0;

      let result;

      var interval = setInterval(() => {
        time += 30;
        message.reply(`check in progress. Time elapsed ${time} seconds`);

        if (time == 120) {
          message.reply("sabar ya");
        }
      }, 30000);

      message.reply(
        `Table selected : ${
          dailyStmnts[parseInt(number)]?.name
        } process will be updated every 30 seconds. please wait`
      );

      // console.log(dailyStmnts[parseInt(number)]?.query);
      result = await connection.execute(dailyStmnts[parseInt(number)]?.query);

      clearInterval(interval);

      connection.release();
      console.log("Done");

      //   console.log(connection);
      const response = result.rows;

      // if (result.rows.length != 0) {
      //   const worksheet = workbook.addWorksheet(`${dailyStmnts[parseInt(number)].name}`);

      //   const newCol = result?.metaData.map((val) => {
      //     return{
      //       header : val.name,
      //       key: val.name,
      //       width : val.name.length > 10 ? val.name.toString().length : 10,
      //       numFmt: '@'
      //     }
      //   })
  
      //   console.log(newCol);
  
      //   worksheet.columns = newCol
  
      //   response.map((val) => {
      //     worksheet.addRow(val)
      //   })
  
      //   // save under export.xlsx
      //   await workbook.xlsx.writeFile('Daily Schedule.xlsx');
  
      //   const media = MessageMedia.fromFilePath('./dailySchedule.xlsx');
      //   message.reply(media);

      //   }


      const waSend = Table.print(response);

      const rows = `Data pada ${
        dailyStmnts[parseInt(number)].name
      } ini sejumlah ${result.rows.length} row`;

      console.log(Table.print(response));

      message.reply(waSend);
      message.reply(rows);
    }
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    clearInterval(interval);
    connection.release();
  }
};

const testAll = async (message, type, changeDate) => {
    const dateSch = moment(Date.now()).format('YYYY/MM/DD')
    const dailyStmnts = date(changeDate, type);
    const res = [];
    const workbook = new Excel.Workbook();

    let summary = `Summary Daily Schedule (${dateSch}) \n`;

    count++;
    console.log(count);
    if (count > 1) {
      message.reply("Sorry, this command is already Running. Please wait for previous command to finish")
      return;
    }

    const connection = await oracledb.getConnection(dbConfig);

  try {
      let time = 0;
      let result;
      message.reply(`Get All data progress Start. Please wait!`);


      console.log(dailyStmnts?.length,'length dailystments')

      var interval = setInterval(() => {
        time += 120;
        message.reply(`check in progress. Time elapsed ${time} seconds`);
      }, 120000);

      let i = 0;

      console.log(dailyStmnts.length, "length");
      while (i < dailyStmnts.length) {

        message.reply(`${i+1}. ${dailyStmnts[i]?.name}`);

        result = await connection.execute(dailyStmnts[i]?.query);

        const response = result.rows;
        const waSend = Table.print(response);

        if (result.rows.length != 0) {
          //Create new Worksheet
          const worksheet = workbook.addWorksheet(`${dailyStmnts[parseInt(i)].name}`);
          const newCol = result?.metaData.map((val) => {
            return{
              header : val.name,
              key: val.name,
              width : val.name.length > 10 ? val.name.toString().length : 10,
              numFmt: '@'
            }
          })    
          worksheet.columns = newCol

          response.map((val) => {
            worksheet.addRow(val)
          })
          const rows = `${
            dailyStmnts[i].name
          } (${result.rows.length} Rows)`;

          summary += `${rows}\n`
        }
        i++;
      }
      // save under export.xlsx   
      await workbook.xlsx.writeFile('DailySchedule.xlsx');
      const media = MessageMedia.fromFilePath('./DailySchedule.xlsx');
      message.reply(media);

      connection.release();
      clearInterval(interval);
      count = 0;
    
      res.map((val)=> {
        message.reply(val)
      })
      message.reply(summary);
   
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    count = 0;
    clearInterval(interval);
    connection.release();
  }
};

module.exports = { test, testAll };