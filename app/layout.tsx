import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "足球 AI 预测",
  description: "足球比赛预测与赔率分析平台"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="topbar">
          <div className="shell topbar-inner">
            <Link className="brand" href="/">
              足球 AI 预测
            </Link>
            <nav className="nav" aria-label="主导航">
              <Link href="/competitions">赛事</Link>
              <Link href="/admin">管理后台</Link>
              <Link href="/admin/evaluations">模型评估</Link>
              <Link href="/admin/llm-settings">LLM 配置</Link>
              <Link href="/admin/odds-monitor">赔率监控</Link>
              <Link href="/admin/experiments">实验台</Link>
            </nav>
          </div>
        </header>
        <main className="shell page">{children}</main>
      </body>
    </html>
  );
}
