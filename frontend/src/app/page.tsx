"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Leaf,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react"
import Link from "next/link"

import { SiteHeader } from "@/components/shared/SiteHeader"
import { ProductListing, formatKg, getStoredListings } from "@/lib/marketData"

const fieldNotes = [
  {
    author: "Fatma Çelik",
    city: "Antalya",
    text: "Serik serasında salkım domates ilk kesime yaklaştı. Kasa ve soğuk araç planı hazır.",
  },
  {
    author: "Recep Aslan",
    city: "Konya",
    text: "Protein değeri 13 üstü olan buğday bu hafta daha hızlı teklif alıyor.",
  },
]

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [listings, setListings] = useState<ProductListing[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setListings(getStoredListings())
      setMounted(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const featuredListings = useMemo(() => listings.slice(0, 3), [listings])
  const totalKg = featuredListings.reduce((sum, item) => sum + item.quantityKg, 0) || 199_600
  const totalOffers = featuredListings.reduce((sum, item) => sum + item.metrics.offers, 0) || 84

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3A5A40] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <SiteHeader />

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-[1720px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-[34px] border border-[#E4DBC8] bg-white p-6 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)] sm:p-8 lg:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D8BD] bg-[#EAF1E4] px-4 py-2 text-xs font-black text-[#2C4C3B]">
              <ShieldCheck className="h-4 w-4" />
              Üretici, tüccar ve saha bilgisini tek yerde toplar
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-[#2A211A] sm:text-6xl lg:text-7xl">
              Emeğin karşılığı daha net görünsün.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#5C4A3D] sm:text-lg">
              Çiftçiden; ürün ilanı, güvenilir alıcı iletişimi, saha paylaşımı ve sezon finansını aynı tasarım diliyle yöneten tarım platformudur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D97742] px-6 text-sm font-black text-white shadow-[0_20px_50px_-26px_rgba(217,119,66,0.95)] transition hover:bg-[#C85A17]"
              >
                Pazar Yerini Aç
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/community"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D97742] px-6 text-sm font-black text-white shadow-[0_20px_50px_-26px_rgba(217,119,66,0.95)] transition hover:bg-[#C85A17]"
              >
                Kahvehaneye Git
                <Users className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D97742] px-6 text-sm font-black text-white shadow-[0_20px_50px_-26px_rgba(217,119,66,0.95)] transition hover:bg-[#C85A17]"
              >
                Tarlamı Gör
                <BarChart3 className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <HeroKpi label="Listelenen tonaj" value={formatKg(totalKg)} icon={Truck} />
              <HeroKpi label="Açık teklif" value={String(totalOffers)} icon={MessageCircle} />
              <HeroKpi label="Doğrulanmış ilan" value="12" icon={ShieldCheck} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            className="relative overflow-hidden rounded-[34px] border border-[#E4DBC8] bg-[#2C4C3B] shadow-[0_34px_90px_-58px_rgba(42,33,26,0.68)]"
          >
            <div className="aspect-[16/10] min-h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero-farm-premium.png" alt="Çiftçiden tarım platformu" className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </section>

        <section className="mx-auto grid w-full max-w-[1720px] gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div className="space-y-6">
            <SectionHeader
              eyebrow="Pazar vitrini"
              title="Öne çıkan ürün partileri"
              action={
                <Link href="/products" className="rounded-full border border-[#D6C7B1] px-4 py-2 text-sm font-black text-[#2C4C3B] transition hover:bg-[#EAF1E4]">
                  Tüm ilanlar
                </Link>
              }
            />

            <div className="grid gap-5 md:grid-cols-3">
              {featuredListings.map((listing) => (
                <HomeListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] bg-[#2C4C3B] p-6 text-[#F9F8F6] shadow-[0_30px_70px_-45px_rgba(44,76,59,0.9)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D97742]">
                <Leaf className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black">Bugünkü saha notu</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#E8DDCD]">
                Malatya’da nem orta seviyede. Kurutma alanı hazırlığı ve sabah erken ürün kontrolü bu hafta alıcı güvenini artırır.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <DarkMetric label="Nem" value="%56" />
                <DarkMetric label="Teklif" value="84" />
                <DarkMetric label="Plan" value="Net" />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <SectionHeader eyebrow="Dijital Kahvehane" title="Sahadan kısa notlar" compact />
              <div className="mt-4 space-y-3">
                {fieldNotes.map((note) => (
                  <article key={note.text} className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A5A40] text-sm font-black text-white">
                        {note.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#2A211A]">{note.author}</div>
                        <div className="text-xs font-semibold text-[#8B7355]">{note.city}</div>
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-6 text-[#5C4A3D]">{note.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="mx-auto w-full max-w-[1720px] border-t border-[#E4DBC8] px-4 py-14 sm:px-6 lg:px-8 space-y-8">
          <SectionHeader eyebrow="KILAVUZ" title="Nasıl Kullanılır?" />
          <div className="grid gap-5 md:grid-cols-3">
            <FlowCard icon={Store} title="İlanı oluştur" text="Ürün, çeşit, şehir, tonaj, teslim ve ödeme bilgisini tek formda gir." />
            <FlowCard icon={Users} title="Alıcıyla görüş" text="İlan kartından detaya geç, teklifleri ve iletişimi hesabın üzerinden yönet." />
            <FlowCard icon={CheckCircle2} title="Sezonu takip et" text="Tarlam ekranında gider, gelir, fiyat trendi ve hava durumunu birlikte izle." />
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  action,
  compact,
}: {
  eyebrow: string
  title: string
  action?: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className={compact ? "" : "flex items-end justify-between gap-4"}>
      <div>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">{eyebrow}</div>
        <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-black tracking-tight text-[#2A211A]`}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function HeroKpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Truck }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-4 text-[#2A211A]">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#8B7355]">
        <Icon className="h-4 w-4 text-[#2C4C3B]" />
        {label}
      </div>
      <div className="text-safe text-xl font-black leading-tight text-[#2C4C3B] sm:text-2xl">{value}</div>
    </div>
  )
}

function HomeListingCard({ listing }: { listing: ProductListing }) {
  const trustScore = Math.round(listing.ai.trustScore ?? listing.ai.confidence ?? 72)
  const listingComment =
    listing.ai.listingComment ||
    listing.ai.analysis ||
    "İlan fotoğraf, açıklama ve ticari bilgiler açısından alıcıya temel güven veriyor."

  return (
    <Link
      href={`/products/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)] transition hover:-translate-y-1 hover:shadow-[0_32px_90px_-58px_rgba(42,33,26,0.65)]"
    >
      <div className="relative h-56 overflow-hidden bg-[#EEE7DA]">
        {listing.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrls[0]} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-14 w-14 text-[#8FA37D]" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-black leading-tight text-[#2A211A]">{listing.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6E5A42]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#2C4C3B]" />
            {listing.city} / {listing.district}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-[#D97742]" />
            {new Date(listing.harvestDate).toLocaleDateString("tr-TR")}
          </span>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <DataPill label="Miktar" value={formatKg(listing.quantityKg)} />
          <DataPill label="Güven skoru" value={`%${trustScore}`} />
        </div>
        <p className="mt-3 rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] px-3 py-2 text-xs font-bold leading-5 text-[#2C4C3B]">
          {listingComment}
        </p>
      </div>
    </Link>
  )
}

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B7355]">{label}</div>
      <div className="text-safe text-sm font-black leading-tight text-[#2A211A]">{value}</div>
    </div>
  )
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D7C9B2]">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  )
}

function FlowCard({ icon: Icon, title, text }: { icon: typeof Store; title: string; text: string }) {
  return (
    <div className="rounded-[30px] border border-[#E4DBC8] bg-white p-6 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.35)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E4DBC8] bg-[#FAF7F2] text-[#2C4C3B]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[#2A211A]">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-[#6E5A42]">{text}</p>
    </div>
  )
}
