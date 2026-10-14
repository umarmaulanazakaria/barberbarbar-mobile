export function asalSocket(alamatApi: string) {
  const url=new URL(alamatApi);
  if(!["http:","https:"].includes(url.protocol)||url.username||url.password)throw new Error("Alamat API tidak valid");
  return url.origin;
}
