export function buildWhatsAppLink(contactWhatsApp: string, itemName: string): string {
  const digits = contactWhatsApp.replace(/\D/g, "");
  const message = `Hi, I'm interested in ${itemName} — saw it on BUMAP.co`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
