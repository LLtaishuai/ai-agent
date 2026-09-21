import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 Tailwind 类名：clsx 处理条件拼接，tailwind-merge 消解冲突，保证外部传入的 className 能覆盖组件默认样式。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
