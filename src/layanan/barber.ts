import { api } from "./api";

import type { Barber } from "../tipe/barber";

export const ambilSemuaBarber = async () => {
  const { data } = await api.get<Barber[]>("/barbers");

  return data;
};
