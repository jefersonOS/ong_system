import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/inscri%C3%A7%C3%B5es",
        destination: "/inscricoes",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
