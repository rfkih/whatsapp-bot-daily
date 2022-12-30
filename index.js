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

client.on("message", (message) => {
  const content = message.body;

  let type = content.substring(0, 5).toLowerCase();
  const number = parseInt(content.substring(5, 7)) - 1;
  let changeDate = content.substring(7, 9);

  //console.log(type, number, changeDate);

  if (type === "check" || type === "daily") {
   
    if (number == "-1") {
      return;
    } else {
      test(message, type, number, changeDate);
    }

  } else if (type === "all" || type === "all-1") {
    console.log('disini')

    console.log(content)
     type = content.substring(0,3)
     changeDate = content.substring(3, 6)

    testAll(message, type, changeDate);

  } else if (type === "list") {
    message.reply(`
Command List :
Check Branch / BF_Count : Format "check(number)"
1. BF_Count
2. Open/Close Branch
3. Check Dwi

Daily Schedule: Format "daily(number)"
1. After Close Branch
2. Cllocation Collateral
3. Check Batch Job Monday
4. Check Batch Job Tuesday Friday
5. Check Batch Job First Day
6. Accrual Have Normal Accrual Bal
7. Accrual Have Npl Acrrual Bal
8. Npl Acrual And Normal AccrualBal
9. Npl Have Normal Accrual Or Non Npl Have Npl Accrual
10. Transaction Backdate
11. Close Account Have balance
12. Giro Prk Cancel Check
13. Gl Balance Check
14. Gl Balance Vs TrxBal
15. Liabilty Minus Check
16. Loan Base NS with Loan Sch
17. Loan Batch Payment Process
18. Ot Batch Check
19. Wrong Amort`);
  }
});

client.initialize();
