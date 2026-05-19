"use client"

/* eslint-disable react/no-unescaped-entities */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, Landmark } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MerchantVerifyPage() {
  const [step, setStep] = useState<"upload" | "scanning" | "success" | "error">("upload")
  const [errorMsg, setErrorMsg] = useState("")

  const [files, setFiles] = useState({
    tax_plate: null as File | null,
    gazette: null as File | null,
    signature: null as File | null
  })

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }))
    }
  }

  const handleVerify = () => {
    if (!files.tax_plate || !files.gazette || !files.signature) {
      setErrorMsg("Lütfen tüm belgeleri yükleyin.")
      setStep("error")
      setTimeout(() => setStep("upload"), 3000)
      return
    }

    setStep("scanning")

    // Mock API call simulation
    setTimeout(() => {
      // Başarı senaryosu
      setStep("success")
    }, 4500)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-700 mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Kurumsal Tüccar Doğrulaması</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Sisteme kayıtlı çiftçilerle doğrudan ticaret yapabilmek için işletme belgelerinizin 
            resmi kayıtlar ve e-Devlet kontrolleriyle doğrulanması gerekmektedir.
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-0">
            
            <AnimatePresence mode="wait">
              
              {/* UPLOAD STEP */}
              {step === "upload" && (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8"
                >
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-8 text-blue-800 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>NACE Kodu Kontrolü:</strong> Sadece "Yaş Meyve Sebze Toptan Ticareti" (46.31) faaliyet koduna sahip işletmeler platformda alım yapabilir.
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Vergi Levhası */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-primary-400 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">Vergi Levhası</h3>
                            <p className="text-sm text-slate-500">Güncel yılı kapsayan vergi levhanız (PDF/PNG)</p>
                          </div>
                        </div>
                        <Button variant={files.tax_plate ? "default" : "outline"} className="relative cursor-pointer">
                          {files.tax_plate ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Yüklendi</> : <><Upload className="w-4 h-4 mr-2"/> Seç</>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('tax_plate', e)} />
                        </Button>
                      </div>
                    </div>

                    {/* Ticaret Sicil Gazetesi */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-primary-400 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">Ticaret Sicil Gazetesi</h3>
                            <p className="text-sm text-slate-500">Kuruluş veya son pay devrini gösterir belge</p>
                          </div>
                        </div>
                        <Button variant={files.gazette ? "default" : "outline"} className="relative cursor-pointer">
                          {files.gazette ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Yüklendi</> : <><Upload className="w-4 h-4 mr-2"/> Seç</>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('gazette', e)} />
                        </Button>
                      </div>
                    </div>

                    {/* İmza Sirküleri */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-primary-400 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">İmza Sirküleri</h3>
                            <p className="text-sm text-slate-500">Noter onaylı güncel imza sirküleri</p>
                          </div>
                        </div>
                        <Button variant={files.signature ? "default" : "outline"} className="relative cursor-pointer">
                          {files.signature ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Yüklendi</> : <><Upload className="w-4 h-4 mr-2"/> Seç</>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('signature', e)} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <Button size="lg" className="bg-primary-600 hover:bg-primary-700 font-bold" onClick={handleVerify}>
                      Belgeleri Tara ve Doğrula
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* SCANNING STEP */}
              {step === "scanning" && (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-16 text-center"
                >
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-xl" />
                    <FileText className="absolute inset-0 m-auto w-12 h-12 text-slate-400" />
                    
                    {/* Laser Scanner Animation */}
                    <motion.div 
                      className="absolute left-0 right-0 h-1 bg-accent-500 shadow-[0_0_10px_2px_rgba(217,119,54,0.5)] z-10"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Belge ve e-Devlet Kontrolü Yapılıyor...</h2>
                  
                  <div className="space-y-3 text-slate-500 max-w-sm mx-auto text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <motion.div className="w-2 h-2 rounded-full bg-primary-500" animate={{opacity: [0.5, 1, 0.5]}} transition={{duration: 1, repeat: Infinity}} />
                      OCR: Vergi Levhası okunuyor...
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div className="w-2 h-2 rounded-full bg-primary-500" animate={{opacity: [0.5, 1, 0.5]}} transition={{duration: 1, repeat: Infinity, delay: 0.3}} />
                      OCR: VKN ve NACE kodu çıkarılıyor...
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div className="w-2 h-2 rounded-full bg-primary-500" animate={{opacity: [0.5, 1, 0.5]}} transition={{duration: 1, repeat: Infinity, delay: 0.6}} />
                      API: e-Devlet ve MERSİS sorgulanıyor...
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS STEP */}
              {step === "success" && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-16 text-center"
                >
                  <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tebrikler, Profiliniz Onaylandı!</h2>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Şirket belgeleriniz e-Devlet ve MERSİS altyapısı üzerinden başarıyla doğrulandı. 
                    Artık çiftçilerle iletişime geçebilir ve teklif verebilirsiniz.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-left mb-8 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-slate-500">VKN:</span>
                      <span className="font-bold text-slate-800">1234567890</span>
                      <span className="text-slate-500">Unvan:</span>
                      <span className="font-bold text-slate-800">ÖRNEK TARIM LTD. ŞTİ.</span>
                      <span className="text-slate-500">NACE:</span>
                      <span className="font-bold text-primary-600">46.31.04</span>
                      <span className="text-slate-500">Durum:</span>
                      <span className="font-bold text-primary-600">AKTİF</span>
                    </div>
                  </div>

                  <Button size="lg" className="bg-primary-600 hover:bg-primary-700 w-full max-w-sm" onClick={() => window.location.href = '/products'}>
                    Pazar Yerine Dön
                  </Button>
                </motion.div>
              )}

              {/* ERROR STEP */}
              {step === "error" && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-16 text-center"
                >
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Doğrulama Başarısız</h2>
                  <p className="text-red-600 font-medium">{errorMsg}</p>
                </motion.div>
              )}

            </AnimatePresence>
            
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
