"use client"

import type { ReactNode } from "react"
import { Home, LayoutDashboard, Leaf, Search, Store, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ProfileButton } from "@/components/shared/ProfileButton"

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/products", label: "Pazar Yeri", icon: Store },
  { href: "/community", label: "Dijital Kahvehane", icon: Users },
  { href: "/dashboard", label: "Tarlam", icon: LayoutDashboard },
]

export default function CommunityLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <header className="sticky top-0 z-40 border-b border-[#E4DBC8] bg-[#F9F8F6]/94 shadow-[0_10px_30px_-24px_rgba(42,33,26,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-full max-w-[1720px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Çiftçiden ana sayfa">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3A5A40] shadow-[0_12px_28px_-14px_rgba(58,90,64,0.9)]">
              <Leaf className="h-5 w-5 text-[#F9F8F6]" />
            </span>
            <span className="text-xl font-black tracking-tight text-[#2C4C3B]">Çiftçiden</span>
          </Link>

          <div className="hidden h-12 min-w-[260px] max-w-[520px] flex-1 items-center gap-3 rounded-2xl border border-[#DED1BC] bg-white/78 px-4 shadow-[0_8px_28px_-22px_rgba(42,33,26,0.45)] xl:flex">
            <Search className="h-5 w-5 shrink-0 text-[#8B7355]" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#2A211A] outline-none placeholder:text-[#8B7355]"
              placeholder="Konu, ürün, şehir veya üretici ara..."
            />
          </div>

          <nav className="ml-auto hidden min-w-0 shrink items-center gap-1 overflow-x-auto rounded-[22px] border border-[#E4DBC8] bg-white/78 p-1 shadow-[0_12px_30px_-24px_rgba(42,33,26,0.55)] lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-3.5 text-sm font-extrabold transition ${
                    active
                      ? "bg-[#2C4C3B] text-white shadow-[0_12px_24px_-18px_rgba(44,76,59,0.9)]"
                      : "text-[#5C4A3D] hover:bg-[#FAF7F2] hover:text-[#2C4C3B]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <ProfileButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
