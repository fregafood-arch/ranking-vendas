import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O limite padrão do Next.js (1 MB) é menor que o limite de foto que
      // a gente valida (5 MB) — sem isto, um upload de foto acima de 1 MB
      // falhava com "Body exceeded 1 MB limit" antes mesmo de chegar na
      // nossa própria validação. 6 MB dá folga pro overhead do
      // multipart/form-data (boundaries, cabeçalhos de campo).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
