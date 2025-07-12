const fs = require('fs')
const path = require('path')

const targetPath = path.resolve(__dirname, './src/environments/environment.prod.ts')

const requiredEnv = [
  'API_KEY',
  'API_URL',
  'AUTH_DOMAIN',
  'PROJECT_ID',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID',
  'MEASUREMENT_ID',
]

// Check for missing environment variables
const missingVars = requiredEnv.filter(key => !process.env[key])

if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}`)
}

// Build the environment file string
const envConfigFile = `
export const environment = {
  production: true,
  apiKey: "${process.env.API_KEY || ''}",
  apiUrl: "${process.env.API_URL || ''}",
  firebase: {
    apiKey: "${process.env.API_KEY || ''}",
    authDomain: "${process.env.AUTH_DOMAIN || ''}",
    projectId: "${process.env.PROJECT_ID || ''}",
    storageBucket: "${process.env.STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.APP_ID || ''}",
    measurementId: "${process.env.MEASUREMENT_ID || ''}"
  }
};
`

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('❌ Error writing environment file:', err)
    process.exit(1)
  } else {
    console.log(`✅ Environment file generated at: ${targetPath}`)
  }
})
