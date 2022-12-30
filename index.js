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


    console.log(message.body)

    if(content.toLowerCase() === "tes123"){
        test(message, content);
    }else if (content.toLowerCase() === "tes1234") {
        test(message, content);
    }
       
       

});
 

client.initialize();