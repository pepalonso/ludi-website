import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { getDynamoDbConfig, getTableName } from "./config.mjs";
import { checkExistingFields, getDate } from "./utils.mjs";

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
  const nom_equip = body.NOM_EQUIP;
  const numero_contacte = body.NUMERO_CONTACTE;
  const mail_contacte = body.MAIL_CONTACTE;
  const jugadors = body.JUGADORS;

  try {
    const conflicts = await checkExistingFields(
      ddbDocClient,
      nom_equip,
      numero_contacte,
      mail_contacte,
    );
    if (conflicts.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Conflicte: ${conflicts.join(", ")} ja esta agafat!`,
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fent scan a la taula",
        error: error.message,
      }),
    };
  }

  const params = {
    TableName: table,
    Item: {
      ID_EQUIP: new_id,
      NOM_EQUIP: nom_equip,
      DATA_INCRIPCIO: date,

      JUGADORS: jugadors.map((jugador) => ({
        NOM: jugador.NOM,
        NEIXAMENT: jugador.NEIXAMENT,
        TALLA_SAMARRETA: jugador.TALLA_SAMARRETA,
      })),

      NUMERO_CONTACTE: numero_contacte,
      MAIL_CONTACTE: mail_contacte,
    },
  };
  console.log("params", { params });

  try {
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added or updated");

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Equip afegit correctament",
        id_equip: new_id,
        hora: date,
        data,
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
