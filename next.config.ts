import type { NextConfig } from "next";

// O site é gerado como páginas prontas (pasta out/), servidas pela Cloudflare.
// As fotos já chegam do painel no tamanho certo (grande e pequena), então não
// passam por otimização de imagem.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
