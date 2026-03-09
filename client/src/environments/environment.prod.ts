/** apiUrl must always be a full URL including scheme (e.g. http://localhost:8080 or https://api.example.com) */
export const environment = {
  production: process.env['PRODUCTION'] === 'true' || false,
  apiUrl: process.env['API_URL'] || 'http://localhost:8080',
  get apiBaseUrl(): string {
    return (this.apiUrl || '').replace(/\/$/, '')
  },
  apiKey: process.env['API_KEY'] || '',
  contactPhone: process.env['CONTACT_PHONE'] || '659173158',
  pricePerPlayer: Number(process.env['PRICE_PER_PLAYER']) || 55,
  pricePerPlayerPremini: Number(process.env['PRICE_PER_PLAYER_PREMINI']) || 40,
  pricePerEntrenador: Number(process.env['PRICE_PER_ENTRENADOR']) ?? 0,
}

