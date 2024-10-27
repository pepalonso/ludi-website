import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const sendEmail = async (toAddress, subject, bodyText) => {
  const client = new SESClient({ region: "eu-west-3" });
  const params = {
    Source: "ludi3x3@gmail.com",
    Destination: { ToAddresses: [toAddress] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: bodyText } },
    },
  };

  try {
    const data = await client.send(new SendEmailCommand(params));
    return { status: "Success", data };
  } catch (error) {
    return { status: "Failed", error };
  }
};
