// Botões em pílula do site (padrão visual da página inicial)
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

export const btnGold = `${base} bg-dourado-400 px-6 py-3.5 text-sm text-marinho-950 shadow-sm hover:bg-dourado-300`;
export const btnDark = `${base} bg-marinho-950 px-6 py-3.5 text-sm text-white hover:bg-marinho-800`;
export const btnOutlineLight = `${base} border border-white/50 px-6 py-3.5 text-sm text-white backdrop-blur-sm hover:bg-white/10`;
export const btnOutline = `${base} border border-areia-300 bg-white px-6 py-3.5 text-sm text-marinho-950 hover:border-marinho-700`;
export const btnWhatsapp = `${base} bg-whatsapp-600 px-6 py-3.5 text-sm text-white hover:bg-whatsapp-700`;
