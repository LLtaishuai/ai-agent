// Turbopack 的 PostCSS transform 以仓库根目录为基准解析插件，
// 所以 @tailwindcss/postcss 必须同时声明在根 package.json 的 devDependencies 中。
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
