import twilio from "twilio";

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const sender = process.env.SENDER_PHONE;
const client = twilio(accountSid, authToken);

export async function sendMessage(body) {
  const teamName = body.NOM_EQUIP;
  const reciverNumber = body.NUMERO_CONTACTE;
  const jugadors = body.JUGADORS;
  const numJugadors = jugadors.length.toString();

  const message = await client.messages.create({
    contentSid: process.env.CONTENT_SID,
    contentVariables: JSON.stringify({
      nomEquip: teamName,
      nomJugadors: numJugadors,
    }),
    from: `whatsapp:+${sender}`,
    to: `whatsapp:+34${reciverNumber}`,
  });

  console.log(message);
}
