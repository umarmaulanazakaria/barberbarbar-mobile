import type { PesananDashboard } from "./pesanan";

export type Dashboard = {
  waiting: number;
  inService: number;
  completedUnpaid: number;
  paidToday: number;

  pelanggan: number;
  barberAktif: number;
  layananAktif: number;

  revenueToday: number;

  pesananTerbaru: PesananDashboard[];
};
