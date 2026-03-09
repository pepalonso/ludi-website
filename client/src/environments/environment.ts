/** apiUrl must always be a full URL including scheme (e.g. http://localhost:8080 or https://api.example.com) */
export const environment = {
  production: process.env['PRODUCTION'] === 'true' || false,
  apiUrl: process.env['API_URL'] || 'http://localhost:8080',
  get apiBaseUrl(): string {
    return (this.apiUrl || '').replace(/\/$/, '')
  },
  apiKey: process.env['API_KEY'] || '',
  /** Contact phone (digits only, e.g. 659173158). Used for WhatsApp links and display. */
  contactPhone: process.env['CONTACT_PHONE'] || '659173158',
  pricePerPlayer: Number(process.env['PRICE_PER_PLAYER']),
  pricePerPlayerPremini: Number(process.env['PRICE_PER_PLAYER_PREMINI']),
  pricePerEntrenador: Number(process.env['PRICE_PER_ENTRENADOR']) ?? 0,
}

