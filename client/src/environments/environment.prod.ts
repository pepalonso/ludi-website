export const environment = {
  production: process.env['PRODUCTION'] === 'true',
  apiUrl: process.env['API_URL'] || '',
  apiKey: process.env['API_KEY'] || '',
};
