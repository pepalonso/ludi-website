const fs = require("fs");
const targetPath = "./src/environments/environment.prod.ts";

const envConfigFile = `
  export const environment = {
    production: true,
    apiKey: "${process.env.API_KEY}",
    apiUrl: "${process.env.API_URL}"
  };
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Environment file generated at ${targetPath}`);
  }
});
