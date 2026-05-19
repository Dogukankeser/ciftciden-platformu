"use client"

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/immutability, react-hooks/exhaustive-deps */

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ShieldCheck, ShieldAlert, MapPin, Briefcase, Loader2, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export default function MerchantProfilePage() {
  const params = useParams()
  const merchantId = params.id as string

  const [merchant, setMerchant] = useState<any>(null)
  const [trustScore, setTrustScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (merchantId) {
      fetchData()
    }
  }, [merchantId])

  const fetchData = async () => {
    try {
      // Paralel istekler: tüccar detayı ve profil puanı
      const [merchantRes, trustRes] = await Promise.all([
        api.get(`/merchants/${merchantId}`),
        api.get(`/ai/trust/${merchantId}`)
      ])
      
      setMerchant(merchantRes.data)
      setTrustScore(trustRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!merchant || !trustScore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl text-slate-500">Tüccar bulunamadı.</p>
      </div>
    )
  }

  const isPremium = trustScore.risk_label === "normal"
  const isWarning = trustScore.risk_label === "warning"
  
  // Renk kodlaması
  const scoreColor = isPremium ? "text-primary-600" : isWarning ? "text-accent-500" : "text-red-600"
  const scoreBg = isPremium ? "bg-primary-50 border-primary-200" : isWarning ? "bg-accent-50 border-accent-200" : "bg-red-50 border-red-200"

  // Basit ibre animasyonu (Gauge)
  const rotation = (trustScore.overall_score / 10) * 180 - 90 // -90 (0) to +90 (10)

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Üst Profil Kartı */}
        <Card className="overflow-hidden border-slate-200">
          <div className="h-32 bg-slate-800 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          </div>
          <CardContent className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center overflow-hidden shrink-0">
                {/* Placeholder Logo */}
                <div className="text-4xl font-black text-slate-300">
                  {merchant.company_name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{merchant.company_name}</h1>
                  {merchant.is_registry_verified && (
                    <span className="flex items-center text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Onaylı
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {merchant.city}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {merchant.successful_transactions} İşlem</span>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-bold text-base shadow-lg">
                  Tüccarla İletişime Geç
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alt Izgara (Profil Puanı ve Detaylar) */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Profil Puanı */}
          <Card className={`md:col-span-1 border-2 ${scoreBg} shadow-md overflow-hidden relative`}>
            {/* Arka plan glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl rounded-full ${isPremium ? 'bg-primary-500' : isWarning ? 'bg-accent-500' : 'bg-red-500'}`} />
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${scoreColor}`} />
                Profil Puanı
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              
              {/* Yarım Daire İbre (Gauge) */}
              <div className="relative w-48 h-24 overflow-hidden mt-4 mb-2">
                {/* Dairenin dışı */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] border-slate-200 box-border" />
                {/* Renkli dolgu (Basit css numarası) */}
                <div 
                  className={`absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] border-b-transparent border-r-transparent box-border transform rotate-45 ${isPremium ? 'border-primary-500' : isWarning ? 'border-accent-500' : 'border-red-500'}`} 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                />
                
                {/* İbre animasyonu */}
                <motion.div 
                  className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-800 origin-bottom rounded-full z-10"
                  style={{ left: 'calc(50% - 2px)' }}
                  initial={{ rotate: -90 }}
                  animate={{ rotate: rotation }}
                  transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.5 }}
                />
                <div className="absolute bottom-[-6px] left-1/2 w-4 h-4 bg-slate-800 rounded-full -translate-x-1/2 z-20" />
              </div>

              <div className={`text-5xl font-black mb-1 ${scoreColor}`}>
                {trustScore.overall_score.toFixed(1)}<span className="text-2xl text-slate-400 font-bold">/10</span>
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">
                {trustScore.risk_label}
              </div>

              <div className="w-full bg-white/60 p-4 rounded-xl text-sm text-slate-700 border border-white/40 mb-4">
                {trustScore.explanation}
              </div>

              {trustScore.risk_factors.length > 0 && (
                <div className="w-full space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">Dikkat Edilecek Noktalar</div>
                  {trustScore.risk_factors.map((factor: string, idx: number) => (
                    <div key={idx} className="flex gap-2 text-xs text-red-600 bg-red-50 p-2 rounded items-start">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {factor}
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>

          {/* Skor Detayları & İletişim Bilgileri */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skor Kırılımı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">İşlem Hacmi (Ağırlık: %40)</span>
                    <span className="text-slate-900">{trustScore.transaction_score}/10</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary-500" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(trustScore.transaction_score / 10) * 100}%` }} 
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">Ödeme Hızı & Sicil (Ağırlık: %40)</span>
                    <span className="text-slate-900">{trustScore.payment_score}/10</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary-500" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(trustScore.payment_score / 10) * 100}%` }} 
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Ortalama ödeme süresi: {merchant.avg_payment_speed_days} gün</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">Çiftçi Değerlendirmeleri (Ağırlık: %20)</span>
                    <span className="text-slate-900">{trustScore.review_score}/10</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent-500" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(trustScore.review_score / 10) * 100}%` }} 
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-slate-800">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-accent-500" /> İletişim Öncesi Tavsiye
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {isPremium ?
                       "Bu tüccarın profil puanı yüksektir. Gönül rahatlığıyla ürününüz için görüşme başlatabilirsiniz."
                      : isWarning ?
                       "Tüccarın profilinde dikkat edilmesi gereken noktalar var. Vadeli satış yapmadan önce peşinat istemeyi değerlendirin."
                      : "Bu tüccar için ödeme koşullarını netleştirmeden ilerlemeyin; nakit ve anında ödeme şartını değerlendirin."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
