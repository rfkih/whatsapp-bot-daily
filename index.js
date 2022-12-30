const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia  } = require('whatsapp-web.js');

const {test} = require('./src/routers')




const client = new Client({
    authStrategy: new LocalAuth()
});
 

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    const content = message.body


 
    const type = content.substring(0,5).toLowerCase()
    const number = content.substring(5,6)


    if(type === "check" || "daily"){
        test(message, type, number)
    }
       
       

});
 

client.initialize();