import { DateTime } from "luxon";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "./config.mjs";

//data en la que s'ha fet la inscripció
export const getDate = () => {
  return DateTime.now().setZone("Europe/Madrid").toISO();
};

//retorna si la incripció te conflictes and els parametres que entren
export const checkExistingFields = async (
  ddbDocClient,
  teamName,
  contactNumber,
  email
) => {
  const tableName = getTableName();
  let data;
  const params = {
    TableName: tableName,
    FilterExpression:
      "NOM_EQUIP = :teamName OR NUMERO_CONTACTE = :contactNumber OR MAIL_CONTACTE = :email",
    ExpressionAttributeValues: {
      ":teamName": teamName,
      ":contactNumber": contactNumber,
      ":email": email,
    },
  };
  try {
    data = await ddbDocClient.send(new ScanCommand(params));
  } catch (err) {
    console.error("error during scan", err);
  }

  const conflicts = [];

  if (data.Items && data.Items.length > 0) {
    data.Items.forEach((item) => {
      if (item.NOM_EQUIP === teamName) conflicts.push("nom equip");
      if (item.NUMERO_CONTACTE === contactNumber) conflicts.push("numero");
      if (item.MAIL_CONTACTE === email) conflicts.push("email");
    });
  }
  return conflicts;
};
