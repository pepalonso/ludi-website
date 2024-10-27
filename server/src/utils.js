import { DateTime } from "luxon";

export const getDate = () => {
  return DateTime.now().setZone("Europe/Madrid").toISO();
};
