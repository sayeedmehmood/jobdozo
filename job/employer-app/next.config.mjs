/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/employer",
  reactStrictMode: true,
  async rewrites() {
    if (process.env.STANDALONE_EMPLOYER === "1") {
      const api = process.env.API_URL || "http://localhost:8123";
      return [
        { source: "/api/:path*", destination: `${api}/api/:path*` },
        { source: "/socket.io/:path*", destination: `${api}/socket.io/:path*` },
      ];
    }
    return [];
  },
};

export default nextConfig;
