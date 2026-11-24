/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `npm run build` produces plain HTML/CSS/JS in ./out
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
