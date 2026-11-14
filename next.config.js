/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'nebcodeback.ngwafrank.com',
      'nebcode.ngwafrank.com',
      'i.ytimg.com',
      'img.youtube.com',
    ],
  },
};
module.exports = nextConfig;
