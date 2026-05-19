"use client"

import { useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Filter,
  Heart,
  Leaf,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Tag,
  Trash2,
  Truck,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { AuthModal } from "@/components/shared/AuthModal"
import { MarketPulseBar, SiteHeader } from "@/components/shared/SiteHeader"
import { AuthUser, getStoredUser, ownerMatchesUser } from "@/lib/auth"
import {
  CATEGORY_OPTIONS,
  PROVINCES,
  ProductListing,
  deleteListing,
  formatKg,
  formatPrice,
  getStoredListings,
} from "@/lib/marketData"

const sortOptions = [
  { value: "newest", label: "En yeni ilanlar" },
  { value: "priceAsc", label: "Fiyat artan" },
  { value: "priceDesc", label: "Fiyat azalan" },
  { value: "quantityDesc", label: "Tonaj yüksek" },
  { value: "trustDesc", label: "En güçlü ilanlar" },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [city, setCity] = useState("")
  const [category, setCategory] = useState("")
  const [quality, setQuality] = useState("")
  const [sort, setSort] = useState("newest")
  const [onlyVerified, setOnlyVerified] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authIntent, setAuthIntent] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const loadListings = () => {
    setLoading(true)
    setProducts(getStoredListings())
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getStoredUser()
      setCurrentUser(user)
      setIsLoggedIn(!!user)
      loadListings()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const categoryMeta = CATEGORY_OPTIONS.find((item) => item.slug === category)

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase("tr-TR")
    const filtered = products.filter((product) => {
      const matchesSearch =
        !query ||
        [product.title, product.category, product.variety, product.city, product.district, product.ownerName, product.description].some(
          (value) => value.toLocaleLowerCase("tr-TR").includes(query),
        )

      return (
        matchesSearch &&
        (!city || product.city === city) &&
        (!category || product.category === category) &&
        (!quality || product.grade === quality) &&
        (!onlyVerified || product.seller.verified)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sort === "priceAsc") return (a.pricePerKg || Number.MAX_SAFE_INTEGER) - (b.pricePerKg || Number.MAX_SAFE_INTEGER)
      if (sort === "priceDesc") return b.pricePerKg - a.pricePerKg
      if (sort === "quantityDesc") return b.quantityKg - a.quantityKg
      if (sort === "trustDesc") return getListingTrustScore(b) - getListingTrustScore(a)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [products, searchQuery, city, category, quality, sort, onlyVerified])

  const marketStats = useMemo(() => {
    const totalKg = filteredProducts.reduce((sum, item) => sum + item.quantityKg, 0)
    const activeListingsCount = filteredProducts.length
    const offers = filteredProducts.reduce((sum, item) => sum + item.metrics.offers, 0)
    return { totalKg, activeListingsCount, offers }
  }, [filteredProducts])

  const requireAuth = (intent: string) => {
    setAuthIntent(intent)
    setIsAuthModalOpen(true)
  }

  const handleCreateListing = () => {
    if (isLoggedIn) {
      window.location.href = "/products/create"
      return
    }

    requireAuth("ilan")
  }

  const handleDeleteListing = (id: string) => {
    deleteListing(id)
    loadListings()
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user)
          setIsLoggedIn(true)
          if (authIntent === "ilan") window.location.href = "/products/create"
        }}
        title={authIntent === "ilan" ? "İlan vermek için giriş yapın" : "Üreticiyle görüşmek için giriş yapın"}
      />

      <SiteHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Ürün, şehir, üretici veya açıklama ara..."
      />
      <MarketPulseBar />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <section className="mb-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative overflow-hidden rounded-[28px] border border-[#E3D7C4] bg-[#FCFAF6] p-5 shadow-[0_20px_70px_-62px_rgba(42,33,26,0.42)] sm:p-7">
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#C8D8BD] bg-[#EEF4E9] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#2C4C3B]">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Onaylı satıcılar & ticari güvence</span>
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-[#2A211A] sm:text-5xl">Pazar Yeri</h1>
                <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-7 text-[#5C4A3D]">
                  Tarımsal ürün ilanlarını kalite derecesi, tonaj, teslimat koşulları ve fiyat bilgisiyle tek ekranda karşılaştırın.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MarketMetric label="Toplam tonaj" value={formatKg(marketStats.totalKg)} icon={Truck} />
                <MarketMetric label="Aktif ilan" value={`${marketStats.activeListingsCount} Adet`} icon={Tag} />
                <MarketMetric label="Açık teklif" value={String(marketStats.offers)} icon={ClipboardCheck} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-[#244635]/25 bg-[#2C4C3B] p-6 text-[#F9F8F6] shadow-[0_24px_70px_-46px_rgba(44,76,59,0.72)]">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#D97742]">
                <Store className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight">Ürününüzü pazara çıkarın</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#E8DDCD]">
                Tek ekranda net ürün bilgisi, teslimat ve fiyat hedefiyle ilan oluşturun.
              </p>
              <button
                type="button"
                onClick={handleCreateListing}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#D97742] px-4 text-sm font-black text-white shadow-[0_18px_36px_-18px_rgba(217,119,66,0.9)] transition hover:bg-[#C85A17] active:scale-[0.98]"
              >
                Yeni İlan Oluştur
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="sticky top-28 rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <div className="mb-5 flex items-center justify-between border-b border-[#E7DCCB] pb-4">
                <div className="flex items-center gap-2 text-lg font-black text-[#2A211A]">
                  <Filter className="h-5 w-5 text-[#2C4C3B]" />
                  Filtreler
                </div>
                <SlidersHorizontal className="h-4 w-4 text-[#8B7355]" />
              </div>

              <div className="space-y-5">
                <div className="relative lg:hidden">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]" />
                  <input
                    type="text"
                    placeholder="İlan ara..."
                    className="h-11 w-full rounded-2xl border border-[#DED1BC] bg-[#FAF7F2] pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#2C4C3B]"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>

                <SelectField
                  label="Şehir"
                  value={city}
                  onChange={setCity}
                  options={[{ value: "", label: "Tüm Türkiye" }, ...PROVINCES.map((province) => ({ value: province, label: province }))]}
                />
                <SelectField
                  label="Kategori"
                  value={category}
                  onChange={(value) => {
                    setCategory(value)
                    setQuality("")
                  }}
                  options={[{ value: "", label: "Tüm ürünler" }, ...CATEGORY_OPTIONS.map((item) => ({ value: item.slug, label: item.name }))]}
                />
                <SelectField
                  label="Kalite"
                  value={quality}
                  onChange={setQuality}
                  options={[
                    { value: "", label: categoryMeta ? "Tüm kalite sınıfları" : "Önce kategori seçin" },
                    ...(categoryMeta?.qualities || []).map((item) => ({ value: item, label: item })),
                  ]}
                  disabled={!categoryMeta}
                />
                <SelectField label="Sıralama" value={sort} onChange={setSort} options={sortOptions} />

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] px-4 py-3 text-sm font-black text-[#2A211A]">
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[#2C4C3B]" />
                    Sadece doğrulanmış
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(event) => setOnlyVerified(event.target.checked)}
                    className="accent-[#2C4C3B]"
                  />
                </label>

                <button
                  type="button"
                  className="h-11 w-full rounded-2xl border border-[#D6C7B1] bg-white text-sm font-black text-[#2C4C3B] transition hover:bg-[#EAF1E4]"
                  onClick={() => {
                    setSearchQuery("")
                    setCity("")
                    setCategory("")
                    setQuality("")
                    setOnlyVerified(true)
                    setSort("newest")
                  }}
                >
                  Filtreleri Temizle
                </button>
              </div>
            </section>
          </aside>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.14em] text-[#8B7355]">Bulunan ilan</div>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-[#2A211A]">
                  {filteredProducts.length} ürün partisi
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCreateListing}
                className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#3A5A40] px-5 text-sm font-black text-white shadow-[0_18px_36px_-24px_rgba(58,90,64,0.9)] transition hover:bg-[#2C4C3B]"
              >
                Yeni İlan Oluştur
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-[470px] animate-pulse rounded-[28px] border border-[#E4DBC8] bg-white" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-[#E4DBC8] bg-white px-6 text-center shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
                <Search className="mb-4 h-16 w-16 text-[#D6C7B1]" />
                <h3 className="mb-2 text-xl font-black text-[#2A211A]">Bu filtrelerde ilan bulunamadı.</h3>
                <p className="mb-5 text-sm font-medium text-[#6E5A42]">Filtreleri gevşetebilir veya ilk ilanı sen oluşturabilirsin.</p>
                <button type="button" className="rounded-2xl bg-[#D97742] px-5 py-3 text-sm font-black text-white" onClick={handleCreateListing}>
                  Ücretsiz İlan Ver
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    isOwner={ownerMatchesUser({ ownerId: listing.ownerId, ownerName: listing.ownerName }, currentUser)}
                    onDelete={() => handleDeleteListing(listing.id)}
                    onContact={() =>
                      isLoggedIn ? window.alert(`${listing.ownerName} ile görüşme başlatılıyor.`) : requireAuth("iletisim")
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function MarketMetric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[22px] border border-[#E7DCCB] bg-white/75 p-3.5 shadow-[0_18px_42px_-36px_rgba(42,33,26,0.5)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4E9] text-[#2C4C3B]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-[#8B7355]">{label}</div>
        <div className="mt-1 truncate text-xl font-black leading-tight text-[#2C4C3B] sm:text-[1.35rem]">{value}</div>
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-black text-[#2A211A]">{label}</label>
      <select
        disabled={disabled}
        className="h-11 w-full rounded-2xl border border-[#DED1BC] bg-[#FAF7F2] px-3 text-sm font-semibold text-[#2A211A] outline-none transition focus:border-[#2C4C3B] disabled:opacity-55"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ListingCard({
  listing,
  index,
  isOwner,
  onDelete,
  onContact,
}: {
  listing: ProductListing
  index: number
  isOwner: boolean
  onDelete: () => void
  onContact: () => void
}) {
  const router = useRouter()
  const hasPrice = listing.priceType === "fixed" && listing.pricePerKg > 0
  const detailHref = `/products/${listing.id}`
  const openDetails = () => router.push(detailHref)
  const trustScore = getListingTrustScore(listing)
  const listingComment = getListingComment(listing)

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="h-full"
    >
      <div
        role="link"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openDetails()
          }
        }}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_-58px_rgba(42,33,26,0.68)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4C3B]/55"
      >
        <div className="relative h-52 overflow-hidden bg-[#EEE7DA]">
          {listing.imageUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrls[0]} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#FAF7F2]">
              <Leaf className="h-14 w-14 text-[#8FA37D]" />
            </div>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B42318] text-white opacity-0 shadow-lg transition group-hover:opacity-100"
              aria-label="İlanı sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black leading-tight text-[#2A211A]">{listing.title}</h2>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B7355]">KG</div>
              <div className="text-xl font-black text-[#2C4C3B]">{hasPrice ? formatPrice(listing.pricePerKg) : "Teklif"}</div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold text-[#6E5A42]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#2C4C3B]" />
              {listing.city} / {listing.district}
            </span>
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-[#D97742]" />
              {formatKg(listing.quantityKg)}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <MiniStat label="Piyasa aralığı" value={`${formatPrice(listing.ai.fairMin)}-${formatPrice(listing.ai.fairMax)}`} />
            <MiniStat label="Güven skoru" value={`%${trustScore}`} />
            <MiniStat label="Teklif" value={String(listing.metrics.offers)} />
          </div>

          <p className="mb-4 rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] px-3 py-2 text-xs font-bold leading-5 text-[#2C4C3B]">
            {listingComment}
          </p>

          <div className="mt-auto border-t border-[#E7DCCB] pt-4">
            <div className="mb-4 flex items-center justify-between text-xs font-bold text-[#8B7355]">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {listing.metrics.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {listing.metrics.favorites}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#3A5A40] text-sm font-black text-white shadow-[0_18px_36px_-26px_rgba(58,90,64,0.9)]">
                Detayları Aç
                <ChevronRight className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onContact()
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D6C7B1] bg-white text-[#2C4C3B] transition hover:bg-[#EAF1E4]"
                aria-label="Üreticiyle iletişime geç"
              >
                <PhoneCall className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function getListingTrustScore(listing: ProductListing) {
  return Math.round(listing.ai.trustScore ?? listing.ai.confidence ?? 72)
}

function getListingComment(listing: ProductListing) {
  return (
    listing.ai.listingComment ||
    listing.ai.analysis ||
    "İlan fotoğraf, açıklama ve ticari bilgiler açısından alıcıya temel güven veriyor."
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-2.5">
      <div className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8B7355]">{label}</div>
      <div className="text-safe text-xs font-black leading-tight text-[#2A211A]">{value}</div>
    </div>
  )
}
