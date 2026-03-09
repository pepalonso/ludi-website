const fs = require("fs");
const path = require("path");

const targetPath = path.resolve(__dirname, "./src/environments/environment.prod.ts");

const requiredEnv = ["API_URL"];

// Check for missing environment variables
const missingVars = requiredEnv.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingVars.join(", ")}`);
}

// Build the environment file string (apiUrl must be full URL with scheme)
const pricePerPlayer = Number(process.env.PRICE_PER_PLAYER) || 55;
const pricePerPlayerPremini = Number(process.env.PRICE_PER_PLAYER_PREMINI) || 40;
const pricePerEntrenador = process.env.PRICE_PER_ENTRENADOR !== undefined ? Number(process.env.PRICE_PER_ENTRENADOR) : 0;

const envConfigFile = `
export const environment = {
  production: true,
  apiUrl: "${process.env.API_URL || ""}",
  get apiBaseUrl() { return (this.apiUrl || "").replace(/\\/$/, ""); },
  apiKey: "${process.env.API_KEY || ""}",
  contactPhone: "${process.env.CONTACT_PHONE || "659173158"}",
  pricePerPlayer: ${pricePerPlayer},
  pricePerPlayerPremini: ${pricePerPlayerPremini},
  pricePerEntrenador: ${pricePerEntrenador}
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error("❌ Error writing environment file:", err);
    process.exit(1);
  } else {
    console.log(`✅ Environment file generated at: ${targetPath}`);
  }
});
