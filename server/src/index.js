import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { getDynamoDbConfig, getTableName } from "./config.js";
import { getDate } from "./utils.js";

export const handler = async (event) => {
  const dynamoDbConfig = getDynamoDbConfig();
  const client = new DynamoDBClient(dynamoDbConfig);
  const ddbDocClient = DynamoDBDocumentClient.from(client);
  const table = getTableName();

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid JSON format",
        error: err.message,
      }),
    };
  }

  const new_id = uuid();
  const date = getDate();
  console.log("date", date);
  const team_name = body.NOM_EQUIP;

  const scan_params = {
    TableName: table,
    FilterExpression:
      "NOM_EQUIP = :teamName OR NUMERO_CONTACTE = :contactNumber OR MAIL_CONTACTE = :email",
    ExpressionAttributeValues: {
      ":teamName": team_name,
      ":contactNumber": body.NUMERO_CONTACTE,
      ":email": body.MAIL_CONTACTE,
    },
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(scan_params));
    if (data.Items && data.Items.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Nom del Equip ja esta agafat" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al fer la query en la database",
        error: error.message,
      }),
    };
  }

  const params = {
    TableName: table,
    Item: {
      ID_EQUIP: new_id,
      NOM_EQUIP: team_name,
      DATA_INCRIPCIO: date,

      NOM_JUGADOR_1: body.NOM_JUGADOR_1,
      NOM_JUGADOR_2: body.NOM_JUGADOR_2,
      NOM_JUGADOR_3: body.NOM_JUGADOR_3,
      ...(body.NOM_JUGADOR_4 && { NOM_JUGADOR_4: body.NOM_JUGADOR_4 }),
      ...(body.NOM_JUGADOR_5 && { NOM_JUGADOR_5: body.NOM_JUGADOR_5 }),

      TALLA_JUGADOR_1: body.TALLA_JUGADOR_1,
      TALLA_JUGADOR_2: body.TALLA_JUGADOR_2,
      TALLA_JUGADOR_3: body.TALLA_JUGADOR_3,
      ...(body.TALLA_JUGADOR_4 && { TALLA_JUGADOR_4: body.TALLA_JUGADOR_4 }),
      ...(body.TALLA_JUGADOR_5 && { TALLA_JUGADOR_5: body.TALLA_JUGADOR_5 }),

      DATA_JUGADOR_1: body.DATA_JUGADOR_1,
      DATA_JUGADOR_2: body.DATA_JUGADOR_2,
      DATA_JUGADOR_3: body.DATA_JUGADOR_3,
      ...(body.DATA_JUGADOR_4 && { DATA_JUGADOR_4: body.DATA_JUGADOR_4 }),
      ...(body.DATA_JUGADOR_5 && { DATA_JUGADOR_5: body.DATA_JUGADOR_5 }),

      NUMERO_CONTACTE: body.NUMERO_CONTACTE,
      MAIL_CONTACTE: body.MAIL_CONTACTE,
    },
  };
  console.log("params", { params });

  try {
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added or updated", data);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Equip afegit correctament",
        data,
        id_equip: new_id,
      }),
    };
    return response;
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al escriure els elements",
        error: err.message,
      }),
    };
  }
};
