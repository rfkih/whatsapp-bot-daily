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
  const dailyStmnts = date(changeDate, type);

  const res = [];

  

  try {
    if (type === "all") {
      let time = 0;

      let result;

      var interval = setInterval(() => {
        time += 30;
        message.reply(`check in progress. Time elapsed ${time} seconds`);

        if (time == 120) {
          message.reply("sabar ya");
        }
      }, 10000);

      let i = 0;

      while (i < 3) {
          console.log(`Done ${i}`);
          const connection = await oracledb.getConnection(dbConfig);

        result = await connection.execute(dailyStmnts[i]?.query);

        connection.release();

        //   console.log(connection);
        const response = result.rows;

        const waSend = Table.print(response);

        const rows = `Data pada ${
          dailyStmnts[i].name
        } ini sejumlah ${result.rows.length} row`;

        console.log(Table.print(response));

        if (result.rows.length != 0) {
          res.push(rows);
          res.push(waSend);
        }

        i++;
      }

      clearInterval(interval);

      res.map((val)=> {
        message.reply(val)
      })
    }
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    clearInterval(interval);
    connection.release();
  }
};

module.exports = { test, testAll };
