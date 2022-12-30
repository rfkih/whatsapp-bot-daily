const router = require("express").Router();
const fs = require('fs');
const oracledb = require('oracledb')
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
const { Client, LocalAuth, MessageMedia  } = require('whatsapp-web.js');
const Table = require('easy-table')

const {bfCount, checkCloseBranch } = require('./data')

const  libPath = 'C:\\oracle\\instantclient_21_8';
const dbConfig = require('../config/dbconfig');


if (libPath && fs.existsSync(libPath)) {
    oracledb.initOracleClient({ libDir: libPath });
  }

const test = async (message, content) => {

    const checkStmnts = [bfCount, checkCloseBranch]
        console.log(content)
 
    const dailyStmnts = [ ]

    try {
        connection = await oracledb.getConnection(dbConfig);

        if (content.toLowerCase() === 'tes123') {
          const  result = await connection.execute(checkStmnts[1]);
      

          connection.release();
  
          const createtable = new Table
  
        const response = result.rows.map((val) => {
            while(val.ENM.length < 20)
            {
                val.ENM = val.ENM + ' '
            }
            if(val.CLS_BIT == null){
             return{
                 ...val,
                 CLS_BIT: 'Open'
                }
            }else if(val.CLS_BIT.substring(0,6) == '202020'){
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
  
   
          const waSend = Table.print(response)

  
          console.log(Table.print(response))
   
          message.reply(waSend)
        
        }else if (content === 'tes1234') {
          const  result = await connection.execute(checkStmnts[0]);
          console.log(result);
 

          connection.release();
  
          const createtable = new Table
  
          result.rows.forEach(function(branch){
              result.metaData.map(function(row){
                  const variable = row.name
                  if (branch[result.metaData.length] == branch[variable] ) {
                      console.log('TERAKHIR')
                      createtable.cell(variable, branch[variable], Table.number(2));
                      createtable.newRow();
                  }else{
                      createtable.cell(variable, branch[variable])
                      console.log('mASIH JALAN')
                  }
                  
                 
              })
          })


        const watest = createtable.toString()
        console.log('-----------')
        console.log(watest)
        console.log('-----------')
  
          const wamessage = result.rows[0].COUNT

          const sendwa = `${wamessage}, perkiraan waktu ${Math.ceil(wamessage/5000)} menit`
          console.log(sendwa)
  
          message.reply(sendwa.toString())
        }
      
        
    
        
    } catch (error) {

        console.log(error);

        connection.release();
    }

}

module.exports = {test}





