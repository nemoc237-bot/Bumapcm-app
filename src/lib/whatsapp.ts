export function buildWhatsAppLink(contactWhatsApp: string, storeName: string): string {
  const digits = contactWhatsApp.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hello, I'm interested in ${storeName} listed on BUMAP.co`
  );
  return `https://wa.me/${digits}?text=${message}`;
}
