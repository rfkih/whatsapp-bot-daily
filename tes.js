// const moment = require('moment')
// const Excel = require('exceljs');

// console.log(moment(Date.now()).format('YYYY/MM/DD'))

// async function exTest(){
//     const workbook = new Excel.Workbook();
//     const worksheet = workbook.addWorksheet("My Sheet");
  
//   worksheet.columns = [
//    {header: 'Id', key: 'id', width: 10},
//    {header: 'Name', key: 'name', width: 32}, 
//    {header: 'D.O.B.', key: 'dob', width: 15,}
//   ];
  
//   worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970, 1, 1)});
//   worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965, 1, 7)});
  
//   // save under export.xlsx
//   await workbook.xlsx.writeFile('export.xlsx');
// }
// exTest();


let star = ``;

for (let i = 0; i < 8; i++) {
    for (let k = 8; k > i ; k--) {
      star += ` `
      // for (let l = 0; l < k; l++) {
      //   star += '*';
      // }
      for (let j = 0; j < i; j++) {
        star += `*`
      }
    }
  star += `\n`
}
console.log(star)