const router = require("express").Router();
const fs = require("fs");
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const Table = require("easy-table");

const {
  bfCount,
  checkCloseBranch,
  allocationCollateral,
  checkBatchJob,
  closeAccountHavebalance,
  giroPrkCancelCheck,
  GlBalanceCheck,
  GlBalanceVsTrxBal,
  liabiltyMinusCheck
} = require("./data");


const libPath = "C:\\oracle\\instantclient_21_8";
const dbConfig = require("../config/dbconfig");

if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

const test = async (message, type, number) => {
  const checkStmnts = [bfCount, checkCloseBranch];
  console.log(type);
  console.log(number);

  const dailyStmnts = [
    closeAccountHavebalance,
    giroPrkCancelCheck,
    GlBalanceCheck,
    GlBalanceVsTrxBal,
    liabiltyMinusCheck,
    checkBatchJob,
    allocationCollateral,
  ];

  const connection = await oracledb.getConnection(dbConfig);
  try {
    if (type === "check") {
      const result = await connection.execute(checkStmnts[parseInt(number)]);
      console.log(checkStmnts[0]);
      //console.log(connection._inProgress);
      connection.release();
      //console.log(connection._inProgress);
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
      const d = false;
      //    console.log(connection._inProgress);
      const start = Date.now();

      let isLoading = true;

      let qwerty = true;

      let time = 0;

      let result;

      var interval =   setInterval(() => {

           
                time += 30;
                message.reply(`check in progress. Time elapsed ${time} seconds`);
      
                if (time == 120) {
                  message.reply("sabar ya");
                
            
      
          } 
        }, 30000);




      message.reply(`Table selected : ${dailyStmnts[parseInt(number)]?.name} process will be updated every 30 seconds. please wait`);
      //  qwerty = false
      result = await connection.execute(dailyStmnts[parseInt(number)]?.query);

  
    clearInterval(interval)
    
      console.log("ini abis await");

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
    clearInterval(interval)
    connection.release();
  }
};

module.exports = { test };
