const router = require("express").Router();
const fs = require("fs");
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const Table = require("easy-table");

const { date } = require("./data");

const libPath = "C:\\oracle\\instantclient_21_8";
const dbConfig = require("../config/dbconfig");

if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

const test = async (message, type, number, changeDate) => {
  //   date(changeDate)

  const dailyStmnts = date(changeDate, type);

  const checkStmnts = date(changeDate, type);
  console.log(type);
  console.log(number);
  const connection = await oracledb.getConnection(dbConfig);

  try {
    if (type === "check") {
      console.log(checkStmnts[parseInt(number)]);
      const result = await connection.execute(checkStmnts[parseInt(number)]);
      //console.log(connection._inProgress);
      connection.release();
      console.log(result.rows);
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

        console.log(Table.print(response));

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

      console.log(dailyStmnts[parseInt(number)]?.query);
      result = await connection.execute(dailyStmnts[parseInt(number)]?.query);

      clearInterval(interval);

      connection.release();
      console.log("Done");

      //   console.log(connection);
      const response = result.rows;

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
    
    const res = [];
    

    const dailyStmnts = date(changeDate, type);

    console.log(dailyStmnts?.length,'length dailystments')
   
  try {
  
      let time = 0;

      let result;
      const connection = await oracledb.getConnection(dbConfig);
      message.reply(`Get All data progress Start. Please wait!`);

      var interval = setInterval(() => {
        time += 120;
        message.reply(`check in progress. Time elapsed ${time} seconds`);

      }, 120000);

      let i = 0;
      
      while (i < dailyStmnts.length) {
       
       console.log(i)
       console.log(dailyStmnts[i]?.name)
       message.reply(`${i+1}. ${dailyStmnts[i]?.name}`);

        result = await connection.execute(dailyStmnts[i]?.query);

        

        //   console.log(connection);
        const response = result.rows;

        const waSend = Table.print(response);

        const rows = `Data pada ${
          dailyStmnts[i].name
        } ini sejumlah ${result.rows.length} row`;

        

        if (result.rows.length != 0) {
         console.log(Table.print(response));
          res.push(rows);
          res.push(waSend);
        }

        i++;
      }
        connection.release();
      clearInterval(interval);

      console.log(res, 'resnyaa');
       

      res.map((val)=> {
        message.reply(val)
      })
   
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    clearInterval(interval);
    connection.release();
  }
};

module.exports = { test, testAll };
