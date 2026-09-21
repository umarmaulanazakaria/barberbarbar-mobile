export type StatusPelanggan = "AKTIF" | "DIBLOKIR";

export type Membership = {
  id: number;
  pelangganId: number;
  memberCode: string;
  discountPercent: number;
  isActive: boolean;
  joinedAt: string;
};

export type Pelanggan = {
  id: number;
  nama: string;
  nomorTelepon: string;
  alamat: string | null;
  dibuatPada: string;
  status: StatusPelanggan;
  membership: Membership | null;
};

export type DataTambahPelanggan = {
  nama: string;
  nomorTelepon: string;
  alamat?: string;
};

export type ResponsBuatMembership = {
  pesan: string;
  data: Membership;
};
