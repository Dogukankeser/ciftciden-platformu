"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  FileCheck2,
  Home,
  LayoutDashboard,
  Leaf,
  Maximize2,
  MapPin,
  Package,
  PhoneCall,
  Pencil,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Truck,
  User,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"

import { AuthModal } from "@/components/shared/AuthModal"
import { ProfileButton } from "@/components/shared/ProfileButton"
import { Button } from "@/components/ui/button"
import { AuthUser, getStoredUser } from "@/lib/auth"
import {
  ProductListing,
  formatDate,
  formatKg,
  formatPrice,
  getStoredListings,
  saveStoredListings,
} from "@/lib/marketData"

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/products", label: "Pazar Yeri", icon: Store, active: true },
  { href: "/community", label: "Dijital Kahvehane", icon: Users },
  { href: "/dashboard", label: "Tarlam", icon: LayoutDashboard },
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [listing, setListing] = useState<ProductListing | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [isEditingListing, setIsEditingListing] = useState(false)
  const [listingDraft, setListingDraft] = useState({ title: "", description: "", pricePerKg: "", quantityKg: "" })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMounted(true)
      const user = getStoredUser()
      setCurrentUser(user)
      setIsLoggedIn(!!user)

      const listings = getStoredListings()
      const found = listings.find((item) => item.id === id)
      if (!found) return

      const viewed = sessionStorage.getItem(`viewed-${found.id}`)
      if (!viewed) {
        const updated = listings.map((item) => item.id === found.id ? {
          ...item,
          metrics: { ...item.metrics, views: item.metrics.views + 1 },
        } : item)
        saveStoredListings(updated)
        sessionStorage.setItem(`viewed-${found.id}`, "true")
        setListing({ ...found, metrics: { ...found.metrics, views: found.metrics.views + 1 } })
        setListingDraft({ title: found.title, description: found.description, pricePerKg: String(found.pricePerKg || ""), quantityKg: String(found.quantityKg || "") })
        setSelectedImageIndex(0)
        return
      }

      setListing(found)
      setListingDraft({ title: found.title, description: found.description, pricePerKg: String(found.pricePerKg || ""), quantityKg: String(found.quantityKg || "") })
      setSelectedImageIndex(0)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id])

  const relatedListings = useMemo(() => {
    if (!listing) return []
    return getStoredListings()
      .filter((item) => item.id !== listing.id && (item.category === listing.category || item.city === listing.city))
      .slice(0, 3)
  }, [listing])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2C4C3B] border-t-transparent" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-5">
        <div className="premium-card max-w-md text-center p-8">
          <Leaf className="w-14 h-14 mx-auto mb-4 text-[#8b7355]" />
          <h1 className="text-2xl font-extrabold text-[#2a1f14] mb-2">İlan bulunamadı</h1>
          <p className="text-sm text-[#6e5a42] mb-5">Bu ilan kaldırılmış ya da henüz yayınlanmamış olabilir.</p>
          <Link href="/products" className="inline-flex h-11 px-5 rounded-xl gradient-green text-white font-bold items-center justify-center">
            Pazar Yerine Dön
          </Link>
        </div>
      </div>
    )
  }

  const hasPrice = listing.priceType === "fixed" && listing.pricePerKg > 0
  const totalValue = hasPrice ? listing.pricePerKg * listing.quantityKg : listing.ai.fairMin * listing.quantityKg
  const selectedImage = listing.imageUrls[selectedImageIndex] || listing.imageUrls[0] || ""
  const isOwner = !!currentUser && listing.ownerId === currentUser.id

  const contact = () => {
    if (!isLoggedIn) {
      setAuthOpen(true)
      return
    }
    alert(`${listing.ownerName} ile görüşme başlatılıyor.`)
  }

  const saveListingEdit = () => {
    if (!isOwner) return
    const updatedListing: ProductListing = {
      ...listing,
      title: listingDraft.title.trim() || listing.title,
      description: listingDraft.description.trim() || listing.description,
      pricePerKg: Number(listingDraft.pricePerKg) || 0,
      priceType: Number(listingDraft.pricePerKg) > 0 ? "fixed" : "offer",
      quantityKg: Number(listingDraft.quantityKg) || listing.quantityKg,
    }
    saveStoredListings(getStoredListings().map((item) => item.id === listing.id ? updatedListing : item))
    setListing(updatedListing)
    setIsEditingListing(false)
  }

  const deleteListing = () => {
    if (!isOwner) return
    saveStoredListings(getStoredListings().filter((item) => item.id !== listing.id))
    router.push("/products")
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} title="Üreticiyle İletişime Geçmek İçin Giriş Yapın" />

      {imageViewerOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 p-4 md:p-8 flex items-center justify-center" onClick={() => setImageViewerOpen(false)}>
          <button
            className="absolute right-5 top-5 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setImageViewerOpen(false)}
            aria-label="Fotoğrafı kapat"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-6xl max-h-full w-full flex flex-col gap-4" onClick={(event) => event.stopPropagation()}>
            <div className="min-h-0 flex-1 rounded-2xl bg-black flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt={listing.title} className="max-w-none md:max-w-full max-h-[78vh] object-contain" />
            </div>
            {listing.imageUrls.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto pb-1">
                {listing.imageUrls.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-16 w-20 shrink-0 rounded-xl overflow-hidden border-2 ${selectedImageIndex === index ? "border-[#f8b567]" : "border-white/20"}`}
                    aria-label={`${index + 1}. fotoğrafı büyüt`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="navbar-light sticky top-0 z-30">
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-safe text-[#2A211A] font-extrabold">Çiftçiden</span>
          </Link>
          <div className="flex items-center gap-1 rounded-[22px] border border-[#E4DBC8] bg-white/72 p-1 shadow-[0_12px_30px_-24px_rgba(42,33,26,0.55)]">
            {navItems.map((nav) => {
              const Icon = nav.icon
              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-bold transition-all ${nav.active ? "bg-[#2C4C3B] text-white shadow-[0_12px_24px_-18px_rgba(44,76,59,0.9)]" : "text-[#5C4A3D] hover:bg-[#FAF7F2] hover:text-[#2C4C3B]"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{nav.label}</span>
                </Link>
              )
            })}
            <ProfileButton />
          </div>
        </div>
      </nav>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <Link href="/products" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#5C4A3D] hover:text-[#2C4C3B]">
          <ArrowLeft className="w-4 h-4" />
          İlanlara geri dön
        </Link>

        <section className="grid lg:grid-cols-[1fr_390px] gap-6">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <div className="grid md:grid-cols-[1.05fr_.95fr]">
                <div className="min-h-[360px] bg-[#FAF7F2] relative p-4 flex flex-col gap-3">
                  {selectedImage ? (
                    <>
                      <button
                        className="group relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-[#E4DBC8] bg-white"
                        onClick={() => setImageViewerOpen(true)}
                        aria-label="Fotoğrafı büyüt"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedImage} alt={listing.title} className="max-w-full max-h-[520px] w-auto h-auto object-contain" />
                        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                          Büyüt
                        </span>
                      </button>
                      {listing.imageUrls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {listing.imageUrls.map((image, index) => (
                            <button
                              key={`${image}-${index}`}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${selectedImageIndex === index ? "border-[#2C4C3B] ring-2 ring-[#2C4C3B]/15" : "border-[#E4DBC8] hover:border-[#C8D8BD]"}`}
                              aria-label={`${index + 1}. fotoğrafı göster`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={image} alt="" className="w-full h-full object-cover" />
                              {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-[#EAF1E4] px-1.5 py-0.5 text-[9px] font-bold text-[#2C4C3B]">Kapak</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#EAF1E4_0%,#FAF7F2_58%,#E4DBC8_100%)]">
                      <div className="text-center px-6">
                        <div className="w-32 h-32 rounded-3xl bg-white/60 border border-white/75 flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <Leaf className="w-16 h-16 text-[#2C4C3B]/60" />
                        </div>
                        <div className="text-2xl font-black text-[#2a1f14] capitalize">{listing.category}</div>
                        <div className="text-sm font-bold text-[#6e5a42]">{listing.variety} · {listing.city}</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-6 top-6 rounded-full bg-white/92 px-4 py-2 text-xs font-black text-[#2C4C3B] shadow-sm">
                    {listing.category} / {listing.variety}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-safe mb-2 text-sm font-bold text-[#2C4C3B]">{listing.category.toLocaleUpperCase("tr-TR")} / {listing.variety}</div>
                      {isEditingListing ? (
                        <input value={listingDraft.title} onChange={(event) => setListingDraft((prev) => ({ ...prev, title: event.target.value }))} className="mb-4 w-full rounded-2xl border border-[#E4DBC8] bg-white px-4 py-3 text-2xl font-black text-[#2A211A] outline-none focus:border-[#2C4C3B]" />
                      ) : (
                        <h1 className="text-safe mb-4 text-2xl font-black leading-tight tracking-tight text-[#2A211A] sm:text-3xl">{listing.title}</h1>
                      )}
                    </div>
                    {isOwner && !isEditingListing && (
                      <div className="flex gap-1">
                        <button onClick={() => setIsEditingListing(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4DBC8] text-[#2C4C3B] hover:bg-[#FAF7F2]" aria-label="İlanı düzenle">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={deleteListing} className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 flex items-center justify-center" aria-label="İlanı sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[#6e5a42] mb-5">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#d97736]" /> {listing.city} / {listing.district}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#2C4C3B]" /> Hasat: {formatDate(listing.harvestDate)}</span>
                  </div>

                  {isEditingListing && (
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input value={listingDraft.quantityKg} onChange={(event) => setListingDraft((prev) => ({ ...prev, quantityKg: event.target.value }))} className="h-10 rounded-xl border border-[#E4DBC8] px-3 text-sm" placeholder="Miktar kg" />
                      <input value={listingDraft.pricePerKg} onChange={(event) => setListingDraft((prev) => ({ ...prev, pricePerKg: event.target.value }))} className="h-10 rounded-xl border border-[#E4DBC8] px-3 text-sm" placeholder="Kg fiyatı" />
                    </div>
                  )}

                  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile label="Miktar" value={formatKg(listing.quantityKg)} icon={Package} />
                    <InfoTile label="İstenen fiyat" value={hasPrice ? `${formatPrice(listing.pricePerKg)}/kg` : "Teklif usulü"} icon={CircleDollarSign} />
                    <InfoTile label="Tahmini değer" value={formatPrice(totalValue)} icon={BarChart3} />
                    <InfoTile label="Görüntüleme" value={String(listing.metrics.views)} icon={Eye} />
                  </div>

                  {isEditingListing ? (
                    <textarea value={listingDraft.description} onChange={(event) => setListingDraft((prev) => ({ ...prev, description: event.target.value }))} className="mb-5 min-h-32 w-full resize-none rounded-xl border border-[#E4DBC8] bg-white px-4 py-3 text-sm text-[#4A3B32] outline-none focus:border-[#2C4C3B]" />
                  ) : (
                    <p className="text-safe mb-5 leading-relaxed text-[#4A3B32]">
                      {listing.description}
                    </p>
                  )}

                  {isEditingListing ? (
                    <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                      <Button variant="outline" className="button-safe flex-1" onClick={() => setIsEditingListing(false)}>İptal</Button>
                      <Button className="button-safe flex-1 gradient-green font-bold text-white" onClick={saveListingEdit}>Kaydet</Button>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                    <Button className="button-safe flex-1 gap-2 bg-[#3A5A40] font-bold text-white hover:bg-[#2C4C3B]" onClick={contact}>
                      <PhoneCall className="w-4 h-4" />
                      Üreticiyle Görüş
                    </Button>
                    <Button variant="outline" className="button-safe border-[#E4DBC8] font-bold text-[#2C4C3B]">
                      Favoriye Al
                    </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <section className="grid lg:grid-cols-2 gap-6">
              <Panel title="Ürün Özellikleri" icon={ClipboardCheck}>
                {listing.dynamic.ürünTipi && <Spec label="Ürün tipi" value={listing.dynamic.ürünTipi} />}
                <Spec label="Çeşit" value={listing.variety} />
                <Spec label="Kalite" value={listing.grade} />
                <Spec label="Kalibre / Boyut" value={listing.size || "Parti standardına göre"} />
                <Spec label="Nem" value={listing.moisture || "Ölçüm talep üzerine"} />
                <Spec label="Brix" value={listing.brix || "Ürün türüne göre değişir"} />
                <Spec label="Paketleme" value={listing.packaging} />
                {Object.entries(listing.dynamic || {})
                  .filter(([key, value]) => Boolean(value) && !["ürünTipi", "çeşit", "kalite", "kalibre"].includes(key))
                  .map(([key, value]) => (
                    <Spec key={key} label={key} value={value} />
                  ))}
              </Panel>

              <Panel title="Lojistik ve Ödeme" icon={Truck}>
                <Spec label="Stok yeri" value={listing.stockLocation} />
                <Spec label="Teslim" value={listing.delivery} />
                <Spec label="Ödeme" value={listing.payment} />
                <Spec label="Sertifikalar" value={listing.certificates.join(", ")} />
              </Panel>
            </section>

            <Panel title="Piyasa Fiyat Aralığı" icon={Sparkles}>
              <div className="grid md:grid-cols-[220px_1fr] gap-5">
                <div className="rounded-[24px] border border-[#C8D8BD] bg-[#F2F6EC] p-5 text-center">
                  <div className="text-[11px] uppercase tracking-wide font-bold text-[#6e5a42] mb-2">Tahmini fiyat aralığı</div>
                  <div className="text-safe text-2xl font-black text-[#2A211A]">{formatPrice(listing.ai.fairMin)} - {formatPrice(listing.ai.fairMax)}</div>
                </div>
                <div>
                  <p className="text-sm text-[#4a392b] leading-relaxed mb-4">{listing.ai.analysis}</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <MiniReason label="Piyasa" value={`${listing.city} hal ve bölge arzı`} />
                    <MiniReason label="Parti" value={`${listing.grade} / ${listing.variety}`} />
                    <MiniReason label="Tonaj" value={formatKg(listing.quantityKg)} />
                  </div>
                </div>
              </div>
            </Panel>

            {relatedListings.length > 0 && (
              <Panel title="Benzer İlanlar" icon={Leaf}>
                <div className="grid md:grid-cols-3 gap-3">
                  {relatedListings.map((item) => (
                    <Link key={item.id} href={`/products/${item.id}`} className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-4 transition-colors hover:bg-white">
                      <div className="mb-1 text-xs font-bold text-[#2C4C3B]">{item.city}</div>
                      <div className="text-safe line-clamp-2 text-sm font-bold text-[#2a1f14]">{item.title}</div>
                      <div className="mt-2 text-xs text-[#8b7355]">{formatKg(item.quantityKg)} · {item.pricePerKg ? `${formatPrice(item.pricePerKg)}/kg` : "Teklif"}</div>
                    </Link>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          <aside className="space-y-5">
            <div className="sticky top-24 rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <div className="flex items-center gap-3 pb-4 border-b border-[#f0e8dc] mb-4">
                <div className="w-12 h-12 rounded-2xl gradient-earth flex items-center justify-center text-white font-black">
                  {listing.ownerName.charAt(0)}
                </div>
                <div>
                  <div className="font-extrabold text-[#2a1f14]">{listing.ownerName}</div>
                  <div className="text-xs text-[#8b7355] flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {listing.ownerRole}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <SideFact icon={BadgeCheck} label="Satıcı doğrulaması" value={listing.seller.verified ? "Profil bilgileri tamamlandı" : "Onay bekliyor"} />
                <SideFact icon={CheckCircle2} label="Tamamlanan işlem" value={`${listing.seller.completedTrades} satış`} />
                <SideFact icon={PhoneCall} label="Yanıt süresi" value={listing.seller.responseTime} />
              </div>

              <Button className="button-safe mb-3 w-full gap-2 bg-[#3A5A40] font-bold text-white hover:bg-[#2C4C3B]" onClick={contact}>
                <PhoneCall className="w-4 h-4" />
                Üreticiyle Görüşme Başlat
              </Button>
              <div className="rounded-xl bg-[#fff8f0] border border-[#feebd4] p-3 text-xs text-[#6e5a42] leading-relaxed">
                Telefon ve teslimat bilgileri giriş sonrası gösterilir. Ödeme koşullarını üreticiyle görüşerek netleştirin.
              </div>
            </div>

            <div className="rounded-[28px] border border-[#2C4C3B]/15 bg-[#2C4C3B] p-5 text-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.6)]">
              <div className="flex items-center gap-2 font-bold mb-3">
                <FileCheck2 className="w-5 h-5 text-[#f8b567]" />
                Ticaret Dosyası Notu
              </div>
              <p className="text-sm text-[#f0e8dc] leading-relaxed">
                Bu detay ekranı ilanı pazar yeri kartından çıkarıp gerçek ticaret dosyasına dönüştürür: kalite, fiyat aralığı, lojistik ve ödeme koşulları tek ekranda görünür.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold text-[#8b7355] mb-1">
        <Icon className="w-3.5 h-3.5 text-[#3a6b1e]" />
        {label}
      </div>
      <div className="text-safe font-black text-[#2C4C3B]">{value}</div>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
      <div className="flex items-center gap-2 font-extrabold text-[#2a1f14] mb-4">
        <Icon className="w-5 h-5 text-[#3a6b1e]" />
        {title}
      </div>
      {children}
    </section>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#f0e8dc] last:border-0">
      <span className="min-w-0 text-sm text-[#8b7355]">{label}</span>
      <span className="text-safe text-right text-sm font-bold text-[#2a1f14]">{value}</span>
    </div>
  )
}

function MiniReason({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-3">
      <div className="text-[10px] uppercase tracking-wide font-bold text-[#8b7355]">{label}</div>
      <div className="text-safe mt-1 text-xs font-bold text-[#2a1f14]">{value}</div>
    </div>
  )
}

function SideFact({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-3">
      <div className="w-9 h-9 rounded-xl bg-[#f0f7ea] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#3a6b1e]" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide font-bold text-[#8b7355]">{label}</div>
        <div className="text-safe text-sm font-bold text-[#2a1f14]">{value}</div>
      </div>
    </div>
  )
}
