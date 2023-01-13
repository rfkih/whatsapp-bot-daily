const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { test, testAll } = require("./src/routers");

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

let i = 0;

client.on("message", (message) => {
  // console.log(message);
  const sender = message.author.split("@");

  if(sender[0] !== "6281278785508")
  {
    return;
  }
  const content = message.body;

  if(content[0] != '!'){
    return
  }

  if(content.length  <= 6 ){
    var type = content.substring(1, 4).toLowerCase();
    // let number = parseInt(content.substring(3, 5)) - 1;
    var changeDate = content.substring(4, 6);
  }else if (content.length  <= 10){
    var type = content.substring(1, 6).toLowerCase();
    var number = parseInt(content.substring(6, 8)) - 1;
    var changeDate = content.substring(8, 10);
  }else {
    return;
  }

  if(content.substring(1,5).toLowerCase() == "list"){
    var type = content.substring(1,5).toLowerCase();
  }
 
  // console.log(type, number, changeDate);

  if (type === "check" || type === "daily") {
    if (number == "-1") {
      return;
    } else {
      test(message, type, number, changeDate);
    }
  } else if (type === "all" || type === "all-1") {
    // console.log('disini')
    // console.log(content)
    testAll(message, type, changeDate);
  } else if (type === "list") {
    message.reply(`
Command List :
Check Branch / BF_Count : Format "!check(number)"
1. BF_Count
2. Open/Close Branch
3. Check CM603

Daily Schedule: Format "!daily(number)"
1. After Close Branch
2. Allocation Collateral
3. Accrual Have Normal Accrual Bal
4. Accrual Have Npl Acrrual Bal
5. Npl Acrual And Normal AccrualBal
6. Npl Have Normal Accrual Or Non Npl Have Npl Accrual
7. Transaction Backdate
8. Close Account Have balance
9. Giro Prk Cancel Check
10. Gl Balance Check
11. Gl Balance Vs TrxBal
12. Liabilty Minus Check
13. Loan Base NS with Loan Sch
14. Loan Batch Payment Process
15. Ot Batch Check
16. Wrong Amort
17. Check Batch Job`);
  }
});

client.initialize();
