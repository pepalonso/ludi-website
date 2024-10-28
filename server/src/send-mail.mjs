import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const sendEmail = async (toAddress) => {
  const client = new SESClient({ region: "eu-west-3" });
  const params = {
    Source: "pepalonsocosta@gmail.com",
    Destination: { ToAddresses: [toAddress] },
    Message: {
      Subject: { Data: mailSubject },
      Body: { Text: { Data: mailBody } },
    },
  };

  try {
    const data = await client.send(new SendEmailCommand(params));
    return { status: "Success", data };
  } catch (error) {
    return { status: "Failed", error };
  }
};

const mailSubject = "Incricpció ludi3x3";

//TODO:
const mailBody = "body of the mailS";
