export const localDynamoDBConfig = {
  endpoint: "http://host.docker.internal:8001",
  region: "eu-west-3",
  credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
};

export const isLocal = () => {
  return process.env.AWS_SAM_LOCAL;
};

export const getDynamoDbConfig = () => {
  return isLocal() ? localDynamoDBConfig : {};
};

export const getTableName = () => {
  return isLocal() ? process.env.table_name : "EQUIPS_LUDIBASQUET";
};
