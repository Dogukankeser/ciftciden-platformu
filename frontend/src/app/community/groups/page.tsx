"use client"

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Plus, MapPin, User } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Group {
  id: string
  name: string
  description: string
  city: string
  memberCount: number
  postCount: number
  createdBy: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: "", description: "", city: "" })
  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsLoggedIn(localStorage.getItem("user_logged_in") === "true")
    setUserName(localStorage.getItem("user_name") || "")

    const stored = JSON.parse(localStorage.getItem("ciftciden_groups") || "[]")
    if (stored.length === 0) {
      const demo: Group[] = [
        { id: "g1", name: "Malatya Kayısıcıları", description: "Malatya ve çevresindeki kayısı üreticilerinin buluşma noktası.", city: "Malatya", memberCount: 156, postCount: 43, createdBy: "Mehmet Çiftçi" },
        { id: "g2", name: "Antalya Seracıları", description: "Sera tarımı yapan çiftçilerimizin deneyim paylaşım grubu.", city: "Antalya", memberCount: 89, postCount: 27, createdBy: "Fatma Hanım" },
        { id: "g3", name: "Ege Zeytincileri", description: "Ege bölgesi zeytin ve zeytinyağı üreticileri.", city: "İzmir", memberCount: 204, postCount: 61, createdBy: "Ali Usta" },
      ]
      localStorage.setItem("ciftciden_groups", JSON.stringify(demo))
      setGroups(demo)
    } else {
      setGroups(stored)
    }
  }, [])

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return
    const group: Group = {
      id: `group_${Date.now()}`,
      name: newGroup.name,
      description: newGroup.description,
      city: newGroup.city,
      memberCount: 1,
      postCount: 0,
      createdBy: userName,
    }
    const updated = [...groups, group]
    setGroups(updated)
    localStorage.setItem("ciftciden_groups", JSON.stringify(updated))
    
    // Grup için boş post listesi oluştur
    localStorage.setItem(`group_posts_${group.id}`, JSON.stringify([]))
    
    setNewGroup({ name: "", description: "", city: "" })
    setShowCreateForm(false)
  }

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#2a1f14]">Dijital Kahvehane Grupları</h2>
        {isLoggedIn && (
          <Button variant="outline" className="text-[#8b7355] border-[#d4c4a8] hover:bg-[#f0e8dc] gap-2" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4" /> Yeni Grup
          </Button>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Grup Oluşturma Formu */}
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <Card className="border-2 border-primary-200 bg-primary-50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-slate-800">Yeni Grup Oluştur</h3>
                <input
                  type="text"
                  placeholder="Grup Adı (Örn: Malatya Kayısıcıları)"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Açıklama"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Şehir (Örn: Malatya)"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm"
                  value={newGroup.city}
                  onChange={(e) => setNewGroup({ ...newGroup, city: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>İptal</Button>
                  <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleCreateGroup}>Oluştur</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Grup Listesi */}
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <a href={`/community/groups/${g.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-safe mb-1 font-bold text-slate-800">{g.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{g.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {g.city}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {g.memberCount} üye</span>
                          <span>{g.postCount} paylaşım</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}
