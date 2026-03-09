
export const environment = {
  production: true,
  apiUrl: "https://api.example.com",
  get apiBaseUrl() { return (this.apiUrl || "").replace(/\/$/, ""); },
  apiKey: "",
  contactPhone: "659173158",
  pricePerPlayer: 55,
  pricePerPlayerPremini: 40,
  pricePerEntrenador: 0
};
