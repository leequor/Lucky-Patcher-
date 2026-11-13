/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Keep dev compiler output away from the production build directory, so a
  // running dev server never rewrites artefacts a deploy is serving.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
