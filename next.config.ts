import type { NextConfig } from 'next';

const config: NextConfig = {
  // Adicione esta seção de 'images'
  images: {
    remotePatterns: [
      {
        protocol: 'https',
                hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default config;