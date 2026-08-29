import type { NextConfig } from 'next';

const config: NextConfig = {
  allowedDevOrigins: ['192.168.1.65', 'localhost:3000', '192.168.1.*'],
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