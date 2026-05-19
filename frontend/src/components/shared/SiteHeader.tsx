"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Home,
  LayoutDashboard,
  Leaf,
  Search,
  Store,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { MARKET_PRICE_TICKER, formatPrice } from "@/lib/marketData"
import { ProfileButton } from "./ProfileButton"

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/products", label: "Pazar Yeri", icon: Store },
  { href: "/community", label: "Dijital Kahvehane", icon: Users },
  { href: "/dashboard", label: "Tarlam", icon: LayoutDashboard },
]

type SiteHeaderProps = {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showCreateButton?: boolean
  onCreateListing?: () => void
}

export function SiteHeader({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Ürün, şehir, üretici ara...",
  showCreateButton,
  onCreateListing,
}: SiteHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4DBC8] bg-[#F9F8F6]/94 shadow-[0_10px_30px_-24px_rgba(42,33,26,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-[1720px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Çiftçiden ana sayfa">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3A5A40] shadow-[0_12px_28px_-14px_rgba(58,90,64,0.9)]">
            <Leaf className="h-5 w-5 text-[#F9F8F6]" />
          </span>
          <span className="text-xl font-black tracking-tight text-[#2C4C3B]">Çiftçiden</span>
        </Link>

        {onSearchChange && pathname !== "/" && pathname !== "/dashboard" && (
          <div className="hidden h-12 min-w-[240px] max-w-[520px] flex-1 items-center gap-3 rounded-2xl border border-[#DED1BC] bg-white/78 px-4 shadow-[0_8px_28px_-22px_rgba(42,33,26,0.45)] xl:flex">
            <Search className="h-5 w-5 shrink-0 text-[#8B7355]" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#2A211A] outline-none placeholder:text-[#8B7355]"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        )}

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

        {showCreateButton && (
          <button
            type="button"
            onClick={onCreateListing}
            className="hidden h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-2xl bg-[#D97742] px-5 text-sm font-black leading-none text-white shadow-[0_18px_36px_-24px_rgba(217,119,66,0.95)] transition hover:bg-[#C85A17] sm:inline-flex"
          >
            + İlan Ver
          </button>
        )}
      </div>
    </header>
  )
}

export function MarketPulseBar() {
  return (
    <section className="border-b border-[#E4DBC8] bg-[#EEE7DA]/70">
      <div className="mx-auto flex h-11 max-w-[1720px] items-center overflow-hidden px-0 sm:px-6 lg:px-8">
        <div className="flex h-full shrink-0 items-center gap-2 bg-[#2C4C3B] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#F9F8F6]">
          <CircleDollarSign className="h-4 w-4" />
          Canlı Hal Barometresi
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-scroll flex items-center gap-10 whitespace-nowrap px-5">
            {[...MARKET_PRICE_TICKER, ...MARKET_PRICE_TICKER].map((price, index) => {
              const rising = price.trend === "up"
              const TrendIcon = rising ? ArrowUpRight : ArrowDownRight

              return (
                <span key={`${price.product}-${index}`} className="inline-flex items-center gap-2 text-sm">
                  <span className="font-black text-[#2A211A]">{price.product}</span>
                  <span className="text-xs font-semibold text-[#8B7355]">
                    {price.city} / {price.variety}
                  </span>
                  <span className="font-black text-[#2C4C3B]">{formatPrice(price.price)}/kg</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black ${
                      rising ? "bg-[#EAF1E4] text-[#2C4C3B]" : "bg-[#FCE7E7] text-[#B42318]"
                    }`}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {rising ? "Yükseliş" : "Düşüş"} %{Math.abs(price.change)}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
