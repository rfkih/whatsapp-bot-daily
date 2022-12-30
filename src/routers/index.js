const router = require("express").Router();
const fs = require('fs');
const oracledb = require('oracledb')
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
const { Client, LocalAuth, MessageMedia  } = require('whatsapp-web.js');
const Table = require('easy-table')

const {bfCount, checkCloseBranch , expenseVBudget, allocationCollateral, checkBatchJob} = require('./data')

const  libPath = 'C:\\oracle\\instantclient_21_8';
const dbConfig = require('../config/dbconfig');


if (libPath && fs.existsSync(libPath)) {
    oracledb.initOracleClient({ libDir: libPath });
  }

const test = async (message, type, number) => {

    const checkStmnts = [bfCount, checkCloseBranch]
        console.log(type)
        console.log(number);
 
    const dailyStmnts = [checkBatchJob, allocationCollateral ]

    try {
        connection = await oracledb.getConnection(dbConfig);  

        if (type === 'check') {
            
          const  result = await connection.execute(checkStmnts[parseInt(number)]);
          console.log(checkStmnts[0])
          //console.log(connection._inProgress);
          connection.release();
          //console.log(connection._inProgress);
        const response = result.rows.map((val) => {
                if (number == '0') {
                    return
                }
                if(val?.CLS_BIT == null){
                    return{
                     ...val,
                     CLS_BIT: 'Open'
                    }
                }else if(val?.CLS_BIT.substring(0,6) == '202020'){
                    return{
                     ...val,
                     CLS_BIT: 'Close'
                    }
                }else{
                    return{
                        ...val,
                        CLS_BIT: 'On Progress'
                    }
                }
        })

            if (number == '0') {
                const wamessage = result.rows[0].COUNT

                const sendwa = `bfcount ${wamessage}, perkiraan waktu ${Math.ceil(wamessage/5000)} menit`
               

                message.reply(sendwa.toString())
                return
             }else{
                const waSend = Table.print(response)
            
                console.log(Table.print(response))
            
                message.reply(waSend)
             }
      
        
        }else if (type === 'daily') {
          const  result = await connection.execute(dailyStmnts[parseInt(number)].query);

          connection.release();
          const response = result.rows
          
            console.log(result.rows.length)

          const waSend = Table.print(response)
          const rows = `Data pada ${dailyStmnts[parseInt(number)].name} ini sejumlah ${result.rows.length} row`
            
                console.log(Table.print(response))
            
                message.reply(waSend)
                message.reply(rows)
  
        }
      
        
    
        
    } catch (error) {

        console.log(error);

        connection.release();
    }

}

module.exports = {test}





