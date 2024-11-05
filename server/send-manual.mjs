import twilio from "twilio";

import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const sender = process.env.SENDER_PHONE;

const reciver = "reciver_number";

function sendManualReply(toNumber, replyMessage) {
  client.messages
    .create({
      from: `whatsapp:${sender}`,
      body: replyMessage,
      to: toNumber,
    })
    .then((message) =>
      console.log(`Message sent to ${toNumber}: ${message.sid}`)
    )
    .catch((error) => console.error("Error sending message:", error));
}

const toNumber = "whatsapp:+34644751886";
const replyMessage = "Hola, que tal estas?";
sendManualReply(toNumber, replyMessage);
