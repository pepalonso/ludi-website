import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

//Replicates the DynamoDB that will be used, in local
const client = new DynamoDBClient({
  region: "eu-west-3",
  endpoint: "http://localhost:8001",
  credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
});

async function crearTaula() {
  const params = {
    TableName: "3x3_Test",
    AttributeDefinitions: [{ AttributeName: "ID_EQUIP", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "ID_EQUIP", KeyType: "HASH" }],
    ProvisionedThroughput: { ReadCapacityUnits: 2, WriteCapacityUnits: 2 },
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("Taula creada correctament", data);
  } catch (err) {
    console.error("Error creant la taula", err);
  }
}

crearTaula();
