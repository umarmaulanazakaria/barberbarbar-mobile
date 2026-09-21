import { api } from "./api";

import type { Dashboard } from "../tipe/dashboard";

export const ambilDashboard = async () => {
  const { data } = await api.get<Dashboard>("/dashboard");

  return data;
};
