export type PeranPengguna = "ADMIN" | "STAFF";

export type Pengguna = {
  id: number;
  name: string;
  email: string;
  role: PeranPengguna;
};

export type ResponsLogin = {
  pesan: string;
  pengguna: Pengguna;
  token: string;
};

export type ResponsProfil = {
  pengguna: Pengguna;
};
