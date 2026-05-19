"use client"

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-html-link-for-pages */

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Users, Heart, MessageCircle, Send, Image as ImageIcon, User, MapPin } from "lucide-react"

import { AuthModal } from "@/components/shared/AuthModal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthUser, getStoredUser } from "@/lib/auth"

interface GroupPost {
  id: string
  authorId: string
  authorEmail: string
  author: string
  authorPhoto: string
  content: string
  imageUrl?: string
  videoUrl?: string
  likes: number
  comments: { authorId: string; author: string; text: string; time: string; authorPhoto: string }[]
  time: string
  likedBy: string[]
}

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<any>(null)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [newPostText, setNewPostText] = useState("")
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})

  const [userPhoto, setUserPhoto] = useState("")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const user = getStoredUser()
    setIsMounted(true)
    setCurrentUser(user)
    setUserPhoto(user?.photo || "")
    setIsLoggedIn(!!user)

    // Grup bilgisini yükle
    const groups = JSON.parse(localStorage.getItem("ciftciden_groups") || "[]")
    const found = groups.find((g: any) => g.id === groupId)
    setGroup(found)

    // Grup postlarını yükle
    const stored = JSON.parse(localStorage.getItem(`group_posts_${groupId}`) || "[]")
    setPosts(stored)
  }, [groupId])

  const savePosts = (updated: GroupPost[]) => {
    setPosts(updated)
    localStorage.setItem(`group_posts_${groupId}`, JSON.stringify(updated))
  }

  const handlePost = () => {
    if (!isLoggedIn || !currentUser) {
      setAuthOpen(true)
      return
    }
    if (!newPostText.trim() && !newPostImage && !newPostVideo) return
    const newPost: GroupPost = {
      id: `gp_${Date.now()}`,
      authorId: currentUser.id,
      authorEmail: currentUser.email,
      author: currentUser.name,
      authorPhoto: currentUser.photo,
      content: newPostText,
      imageUrl: newPostImage || undefined,
      videoUrl: newPostVideo || undefined,
      likes: 0,
      comments: [],
      time: "Şimdi",
      likedBy: []
    }
    savePosts([newPost, ...posts])
    setNewPostText("")
    setNewPostImage(null)
    setNewPostVideo(null)
    
    // Post sayısını güncelle
    const groups = JSON.parse(localStorage.getItem("ciftciden_groups") || "[]")
    const updated = groups.map((g: any) => g.id === groupId ? { ...g, postCount: (g.postCount || 0) + 1 } : g)
    localStorage.setItem("ciftciden_groups", JSON.stringify(updated))
  }

  const handleLike = (postId: string) => {
    if (!isLoggedIn || !currentUser) {
      setAuthOpen(true)
      return
    }
    const updated = posts.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likedBy.includes(currentUser.id) || p.likedBy.includes(currentUser.name)
        return { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1, likedBy: alreadyLiked ? p.likedBy.filter(n => n !== currentUser.id && n !== currentUser.name) : [...p.likedBy, currentUser.id] }
      }
      return p
    })
    savePosts(updated)
  }

  const handleComment = (postId: string) => {
    if (!isLoggedIn || !currentUser) {
      setAuthOpen(true)
      return
    }
    const text = commentTexts[postId]
    if (!text.trim()) return
    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, { authorId: currentUser.id, author: currentUser.name, authorPhoto: currentUser.photo, text, time: "Şimdi" }] }
      }
      return p
    })
    savePosts(updated)
    setCommentTexts(prev => ({ ...prev, [postId]: "" }))
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'image') setNewPostImage(reader.result as string)
      if (type === 'video') setNewPostVideo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const isLikedByCurrentUser = (post: GroupPost) => (
    !!currentUser && (post.likedBy.includes(currentUser.id) || post.likedBy.includes(currentUser.name))
  )

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center text-slate-400">Grup yükleniyor...</div>

  return (
    <>
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user)
          setUserPhoto(user.photo)
          setIsLoggedIn(true)
        }}
        title="Grupta Paylaşım Yapmak İçin Google ile Giriş Yapın"
      />

      {/* Header / Info inside a Card */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden mb-6">
        <div className="bg-[#8b7355] text-white p-6">
          <a href="/community/groups" className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Gruplara Dön
          </a>
          <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
          <p className="text-white/90 text-sm mb-3">{group.description}</p>
          <div className="flex gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.city}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.memberCount} üye</span>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* New Post */}
        {isLoggedIn && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <a href="/profile/me" className="shrink-0">
                  {userPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                </a>
                <div className="flex-1">
                  <textarea
                    placeholder={`${group.name} grubunda paylaşım yap...`}
                    className="w-full resize-none border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  />
                  {newPostImage && (
                    <div className="mt-2 relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newPostImage} alt="" className="h-32 rounded-lg object-cover" />
                      <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  )}
                  {newPostVideo && (
                    <div className="mt-2 relative inline-block">
                      <video src={newPostVideo} className="h-32 rounded-lg object-cover" controls />
                      <button onClick={() => setNewPostVideo(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-primary-600">
                        <ImageIcon className="w-5 h-5" /> Fotoğraf
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'image')} />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-primary-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg> Video
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} />
                      </label>
                    </div>
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 gap-2" onClick={handlePost}>
                      <Send className="w-4 h-4" /> Paylaş
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Bu grupta henüz paylaşım yok. İlk paylaşımı sen yap!</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <a href={`/profile/${encodeURIComponent(post.author)}`} className="shrink-0">
                      {post.authorPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.authorPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                      )}
                    </a>
                    <div>
                      <a href={`/profile/${encodeURIComponent(post.author)}`} className="font-bold text-slate-800 text-sm hover:underline">{post.author}</a>
                      <div className="text-xs text-slate-400">{post.time}</div>
                    </div>
                  </div>
                  <p className="text-slate-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover" />
                  )}
                  {post.videoUrl && (
                    <video src={post.videoUrl} className="w-full rounded-xl mb-3 max-h-96 object-cover bg-black" controls />
                  )}
                  <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
                    <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-sm font-medium transition-colors ${isLikedByCurrentUser(post) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                      <Heart className={`w-4 h-4 ${isLikedByCurrentUser(post) ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-slate-400"><MessageCircle className="w-4 h-4" /> {post.comments.length}</span>
                  </div>
                  {post.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                      {post.comments.map((c, ci) => (
                        <div key={ci} className="flex gap-2 text-sm items-center">
                          {c.authorPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.authorPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                          <span className="font-bold text-slate-700">{c.author}:</span>
                          <span className="text-slate-600">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isLoggedIn && (
                    <div className="flex gap-2 mt-3">
                      <input type="text" placeholder="Yorum yaz..." className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" value={commentTexts[post.id] || ""} onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)} />
                      <Button size="sm" variant="ghost" onClick={() => handleComment(post.id)}><Send className="w-4 h-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </>
  )
}
