// lib/whatsapp.ts
export function buildWhatsAppLink(contactWhatsApp: string, itemName: string): string {
  const digitsOnly = contactWhatsApp.replace(/[^\d]/g, "");
  const message = `Hi, I'm interested in ${itemName} — saw it on BUMAP`;
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
