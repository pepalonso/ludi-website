/** apiUrl must always be a full URL including scheme (e.g. http://localhost:8080 or https://api.example.com) */
export const environment = {
  production: process.env['PRODUCTION'] === 'true' || false,
  apiUrl: process.env['API_URL'] || 'http://localhost:8080',
  get apiBaseUrl(): string {
    return (this.apiUrl || '').replace(/\/$/, '')
  },
  apiKey: process.env['API_KEY'] || '',
}

