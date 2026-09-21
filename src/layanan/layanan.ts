import { api } from "./api";

import type { Layanan } from "../tipe/layanan";

export const ambilSemuaLayanan = async () => {
  const { data } = await api.get<Layanan[]>("/layanan");

  return data;
};
