"use client"

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, MapPin, Tag, Leaf, ShieldAlert, Sparkles, Loader2, ArrowRight, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// Sabit veriler (Gerçekte API'den de çekilebilir)
const CATEGORIES = ["kayısı", "domates", "biber", "elma", "portakal"]
const VARIETIES: Record<string, string[]> = {
  "kayısı": ["Hacıhaliloğlu", "Kabaaşı", "Çataloğlu"],
  "domates": ["Salkım Domates", "Sırık Domates", "Cherry"],
}
const CITIES = ["Malatya", "Elazığ", "Antalya", "Mersin", "İstanbul", "Ankara"]

export default function FairPricePage() {
  const [category, setCategory] = useState("kayısı")
  const [variety, setVariety] = useState("Hacıhaliloğlu")
  const [city, setCity] = useState("Malatya")
  const [quantity, setQuantity] = useState("1000")
  const [grade, setGrade] = useState("1. Kalite")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post("/ai/price", {
        category,
        variety: variety || undefined,
        city,
        quality_grade: grade,
        quantity_kg: parseFloat(quantity) || 100,
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response.data.detail || "Fiyat hesaplanırken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-4 py-12 text-[#2A211A] sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mb-2 inline-flex items-center justify-center rounded-2xl bg-[#EAF1E4] p-3">
            <Calculator className="h-8 w-8 text-[#2C4C3B]" />
          </div>
          <h1 className="text-safe text-4xl font-black tracking-tight text-[#2A211A]">
            Piyasa Fiyat Aralığı
          </h1>
          <p className="text-safe mx-auto max-w-2xl text-lg text-[#6E5A42]">
            Güncel hal fiyatları, bölgesel arz-talep dengesi ve mevsimsellik birlikte değerlendirilerek anlaşılır bir piyasa değeri hazırlanır.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Form Kartı */}
          <Card className="md:col-span-5 border-0 glass-card shadow-lg border-[#3d3228]">
            <CardHeader className="bg-[#1a1610] border-b border-[#3d3228]">
              <CardTitle className="text-xl flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#5c6e46]" />
                Ürün Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#f0e8dc]">Kategori</label>
                <select 
                  className="w-full h-11 px-3 rounded-xl border border-[#3d3228] bg-[#1a1610] focus:ring-2 focus:ring-primary-500 outline-none"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setVariety(VARIETIES[e.target.value]?.[0] || "")
                  }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {VARIETIES[category] && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#f0e8dc]">Ürün Çeşidi</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-[#3d3228] bg-[#1a1610] focus:ring-2 focus:ring-primary-500 outline-none"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                  >
                    {VARIETIES[category].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#f0e8dc] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#a89b88]" /> Şehir / Bölge
                </label>
                <select 
                  className="w-full h-11 px-3 rounded-xl border border-[#3d3228] bg-[#1a1610] focus:ring-2 focus:ring-primary-500 outline-none"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#f0e8dc]">Miktar (kg)</label>
                  <input 
                    type="number" 
                    className="w-full h-11 px-3 rounded-xl border border-[#3d3228] bg-[#1a1610] focus:ring-2 focus:ring-primary-500 outline-none"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#f0e8dc]">Kalite</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-[#3d3228] bg-[#1a1610] focus:ring-2 focus:ring-primary-500 outline-none"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="1. Kalite">1. Kalite</option>
                    <option value="2. Kalite">2. Kalite</option>
                  </select>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base font-bold shadow-md shadow-primary-500/20" 
                onClick={handleCalculate}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                {loading ? "Hesaplanıyor..." : "Piyasa Aralığını Hesapla"}
              </Button>

            </CardContent>
          </Card>

          {/* Sonuç Kartı */}
          <div className="md:col-span-7">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-red-200 glass-card bg-red-50 h-full flex flex-col items-center justify-center p-12 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
                    <h3 className="text-xl font-bold text-red-900 mb-2">Hesaplama Hatası</h3>
                    <p className="text-red-700">{error}</p>
                  </Card>
                </motion.div>
              ) : !result && !loading ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full"
                >
                  <Card className="h-full border-dashed border-2 bg-transparent flex flex-col items-center justify-center p-12 text-center text-[#a89b88]">
                    <Leaf className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Lütfen ürün bilgilerini seçip "Hesapla" butonuna basın.</p>
                  </Card>
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="flex flex-col items-center text-[#7f9162]">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="font-semibold animate-pulse">Büyük veri analiz ediliyor...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="h-full"
                >
                  <Card className="h-full border-0 glass-card border-[#3d3228] shadow-xl shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 bg-[#3d3228]/40 text-[#f0e8dc] text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-[#3d3228] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> %{(result.confidence_level * 100).toFixed(0)} Güven
                    </div>
                    
                    <CardHeader className="bg-[#1a1610] border-b border-[#3d3228] pb-8">
                      <CardDescription className="text-[#7f9162] font-semibold mb-1">Tahmini Piyasa Değeri</CardDescription>
                      <CardTitle className="text-4xl md:text-5xl font-black text-[#f0e8dc] tracking-tighter">
                        {result.estimated_min_price} - {result.estimated_max_price} <span className="text-2xl text-[#a89b88] font-bold">TL/kg</span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="bg-[#0f0d0a] text-[#f0e8dc] p-4 rounded-xl text-sm text-[#f0e8dc] leading-relaxed mb-6 border border-[#3d3228]">
                        {result.explanation}
                      </div>

                      <h4 className="font-bold text-[#f0e8dc] mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent-500" /> Fiyat Etki Faktörleri
                      </h4>
                      
                      <div className="space-y-3">
                        <FactorBar label="Bölgesel Arz/Talep" value={result.factors.bolgesel_arz_talep} />
                        <FactorBar label="Mevsimsellik Etkisi" value={result.factors.mevsimsellik} />
                        <FactorBar label="Kalite Çarpanı" value={result.factors.kalite_carpani} />
                      </div>

                      <div className="mt-8 flex gap-4">
                        <Button className="flex-1">
                          İlan Ver <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  )
}

function FactorBar({ label, value }: { label: string, value: number }) {
  // 1.0 nötr, altı kırmızı, üstü yeşil (veya duruma göre değişir)
  // Basit görselleştirme:
  const isPositive = value >= 1.0;
  const percentage = Math.min(100, Math.max(0, (value - 0.5) * 100)); // basit normalize
  
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-safe text-xs font-semibold text-[#a89b88]">{label}</div>
      <div className="flex-1 h-3 bg-[#231e17] rounded-full overflow-hidden flex">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isPositive ? 'bg-[#1a1610]0' : 'bg-accent-500'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-12 text-right text-xs font-bold text-[#f0e8dc]">
        {value.toFixed(2)}x
      </div>
    </div>
  )
}
