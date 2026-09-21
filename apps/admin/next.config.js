/** @type {import('next').NextConfig} */
const nextConfig = {
  // @repo/ui 直接导出 TSX 源码，需要由应用自己编译共享包
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
