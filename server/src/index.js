import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { getDynamoDbConfig, getTableName } from "./config.js";

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
  const team_name = body.NOM_EQUIP;

  const scan_params = {
    TableName: table,
    FilterExpression: "NOM_EQUIP = :value",
    ExpressionAttributeValues: {
      ":value": team_name,
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
      NOM_JUGADOR_1: body.NOM_JUGADOR_1,
      NOM_JUGADOR_2: body.NOM_JUGADOR_2,
      NOM_JUGADOR_3: body.NOM_JUGADOR_3,
      NOM_JUGADOR_4: body.NOM_JUGADOR_4,
      NOM_JUGADOR_5: body.NOM_JUGADOR_5,
    },
  };
  console.log("params", { params });

  try {
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added or updated", data);

    const response = {
      statusCode: 200,
      body: JSON.stringify({ message: "Equip afegit correctament", data }),
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
