import { useEffect, useState, useRef, memo } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"
import { Eye, Heart, MessageSquare, Share2, Globe, Lock, Megaphone, Calendar, Tag, MoreVertical, Trash2, Edit3, Send } from "lucide-react"

const POST_TYPES = [
  { value: "announcement", label: "Announcement", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Megaphone className="h-4 w-4" /> },
  { value: "promotion", label: "Product Promotion", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Tag className="h-4 w-4" /> },
  { value: "event", label: "Event / Campaign", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <Calendar className="h-4 w-4" /> },
  { value: "internal", label: "Internal Alert", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700", icon: <Lock className="h-4 w-4" /> }
]

// Separate Component for individual Post to handle IntersectionObserver (Auto View Counter)
const PostCard = memo(({ post, user, profile, onLike, onCommentToggle, onShare, onEdit, onDelete, expandedComments, commentInput, onCommentChange, onCommentSubmit }) => {
  const cardRef = useRef(null)
  const hasViewed = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasViewed.current) {
        hasViewed.current = true
        incrementView(post.id)
      }
    }, { threshold: 0.5 })

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [post.id])

  const incrementView = async (postId) => {
    try {
      await supabase.rpc('increment_announcement_views', { announcement_id: postId })
    } catch (e) {
      // Fallback if RPC doesn't exist
      await supabase.from("announcements").update({ views_count: (post.views_count || 0) + 1 }).eq("id", postId)
    }
  }

  const typeConfig = POST_TYPES.find(t => t.value === post.post_type) || POST_TYPES[0]
  const isAuthor = post.created_by === user?.id
  const isExpanded = expandedComments.includes(post.id)

  return (
    <div ref={cardRef} className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:border-blue-500/20 group animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="p-8 md:p-10 flex items-start justify-between border-b-2 border-slate-50 dark:border-slate-900/50 bg-slate-50/30 dark:bg-slate-900/20">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-lg border-2 border-white dark:border-slate-700 group-hover:scale-105 transition-transform">
            {post.companies?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                {post.companies?.name || "Corporate Entity"}
              </h3>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${typeConfig.color}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 font-black text-[10px] uppercase tracking-widest text-slate-400">
              <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-slate-200 dark:text-slate-700">|</span>
              <span className={`flex items-center gap-1.5 ${post.visibility === 'public' ? 'text-emerald-500' : 'text-blue-500'}`}>
                {post.visibility === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {post.visibility === 'public' ? 'Public Hub' : 'Internal Feed'}
              </span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(post)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500 transition-all">
              <Edit3 className="h-5 w-5" />
            </button>
            <button onClick={() => onDelete(post.id)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-10 py-10 md:px-16">
        <h4 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">{post.title}</h4>
        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line text-lg md:text-2xl leading-relaxed font-medium opacity-90">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="w-full bg-slate-50 dark:bg-slate-900 border-y-2 border-slate-100 dark:border-white/5 bg-black">
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls className="w-full max-h-[700px] outline-none mx-auto" />
          ) : (
            <img src={post.media_url} alt={post.title} className="w-full max-h-[700px] object-contain mx-auto" />
          )}
        </div>
      )}

      {/* Engagement Summary */}
      <div className="px-10 py-6 md:px-16 border-t-2 border-slate-50 dark:border-white/5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex gap-8">
          <span className="flex items-center gap-2 hover:text-red-500 transition-colors">
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-red-500 text-red-500' : ''}`} /> {post.likesCount} <span className="hidden sm:inline">Reactions</span>
          </span>
          <span className="flex items-center gap-2 hover:text-blue-500 transition-colors">
            <MessageSquare className="h-4 w-4" /> {post.commentsCount} <span className="hidden sm:inline">Comments</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-500">
           <Eye className="h-4 w-4 text-blue-500" /> {post.views_count || 0} <span className="hidden sm:inline">Total Views</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 divide-x-2 divide-slate-100 dark:divide-white/5 border-t-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
        <button 
          onClick={() => onLike(post)} 
          className={`py-6 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${post.likedByMe ? 'text-red-500 bg-red-50/30 dark:bg-red-900/20' : 'text-slate-500 hover:bg-white dark:hover:bg-white/5'}`}
        >
          <Heart className={`h-5 w-5 ${post.likedByMe ? 'fill-red-500' : ''}`} /> {post.likedByMe ? 'Liked' : 'Like'}
        </button>
        <button 
          onClick={() => onCommentToggle(post.id)} 
          className={`py-6 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${isExpanded ? 'text-blue-600 bg-blue-50/30 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-white dark:hover:bg-white/5'}`}
        >
          <MessageSquare className="h-5 w-5" /> Comment
        </button>
        <button 
          onClick={() => onShare(post.id)} 
          className="py-6 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:hover:bg-white/5 transition-all"
        >
          <Share2 className="h-5 w-5" /> Share
        </button>
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <div className="p-10 md:p-16 border-t-2 border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 animate-in slide-in-from-top-4 duration-300">
          <div className="flex gap-4 mb-10">
            <input
              type="text" placeholder="Add a corporate response..."
              value={commentInput || ""}
              onChange={(e) => onCommentChange(post.id, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCommentSubmit(post)}
              className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 px-8 py-5 rounded-2xl md:rounded-[2rem] outline-none focus:border-blue-500 shadow-sm text-lg font-bold"
            />
            <button onClick={() => onCommentSubmit(post)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl md:rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-8">
            {post.comments.length === 0 ? (
              <p className="text-center text-slate-400 font-bold italic py-4">No discussions yet. Be the first to reply.</p>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-5 group">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-400 shrink-0 shadow-inner">
                    {comment.id === 'temp' ? '...' : 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm group-hover:border-blue-500/20 transition-all">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Team Collaborator</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{comment.comment_text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
})

function Feed() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState("all")
  
  const [form, setForm] = useState({ title: "", content: "", visibility: "internal", post_type: "announcement" })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [expandedComments, setExpandedComments] = useState([])
  const [commentInputs, setCommentInputs] = useState({})
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fetchPosts = async () => {
    let query = supabase.from("announcements").select("*, companies(name)").order("created_at", { ascending: false })
    if (profile?.role !== "super_admin" && profile?.company_id) {
      query = query.or(`visibility.eq.public,and(visibility.eq.internal,company_id.eq.${profile.company_id})`)
    }
    const { data: announcementsData } = await query
    const { data: likesData } = await supabase.from("announcement_likes").select("*")
    const { data: commentsData } = await supabase.from("announcement_comments").select("*").order("created_at", { ascending: true })

    const mergedPosts = (announcementsData || []).map((post) => {
      const postLikes = (likesData || []).filter(l => l.announcement_id === post.id)
      const postComments = (commentsData || []).filter(c => c.announcement_id === post.id)
      return {
        ...post,
        likesCount: postLikes.length,
        commentsCount: postComments.length,
        comments: postComments,
        likedByMe: postLikes.some(l => l.user_id === user?.id)
      }
    })
    setPosts(mergedPosts)
  }

  useEffect(() => { if (user?.id) fetchPosts() }, [user?.id])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) { setSelectedImage(null); setImagePreview(""); return }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadMedia = async (file) => {
    if (!file) return null
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `posts/${fileName}`
    const { error } = await supabase.storage.from("feed-images").upload(filePath, file)
    if (error) throw error
    const { data } = supabase.storage.from("feed-images").getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) { setError("Title and content required"); return }
    setLoading(true)
    try {
      let mediaUrl = imagePreview
      let mediaType = selectedImage 
        ? (selectedImage.type?.startsWith("video") ? "video" : "image")
        : (editingId ? posts.find(p => p.id === editingId)?.media_type : "image")
      
      if (selectedImage) {
        mediaUrl = await uploadMedia(selectedImage)
      }

      const payload = { 
        ...form, 
        company_id: profile.company_id, 
        media_url: mediaUrl, 
        media_type: mediaType,
        created_by: user.id 
      }
      
      if (editingId) {
        await supabase.from("announcements").update(payload).eq("id", editingId)
        setMessage("Post updated!")
      } else {
        await supabase.from("announcements").insert([payload])
        setMessage("Post published!")
      }
      
      setForm({ title: "", content: "", visibility: "internal", post_type: "announcement" })
      setSelectedImage(null); setImagePreview(""); setEditingId(null)
      fetchPosts()
    } catch (err) { 
      console.error("Submit Error:", err)
      setError(err.message) 
    }
    setLoading(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleToggleLike = async (post) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 } : p))
    if (post.likedByMe) {
      await supabase.from("announcement_likes").delete().match({ announcement_id: post.id, user_id: user.id })
    } else {
      await supabase.from("announcement_likes").insert([{ announcement_id: post.id, company_id: profile.company_id, user_id: user.id }])
    }
  }

  const handleAddComment = async (post) => {
    const text = commentInputs[post.id]?.trim()
    if (!text) return
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1, comments: [...p.comments, { id: 'temp', comment_text: text, created_at: new Date().toISOString() }] } : p))
    setCommentInputs(prev => ({ ...prev, [post.id]: "" }))
    await supabase.from("announcement_comments").insert([{ announcement_id: post.id, company_id: profile.company_id, user_id: user.id, comment_text: text }])
    fetchPosts()
  }

  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true
    if (filter === "internal") return post.visibility === "internal" && post.company_id === profile?.company_id
    if (filter === "public") return post.visibility === "public"
    if (filter === "campaigns") return post.post_type === "promotion" || post.post_type === "event"
    return true
  })

  return (
    <AppLayout title="Corporate Feed" subtitle="Unified News, Marketing & Engagement">
      <div className="max-w-5xl mx-auto space-y-12 pb-32">
        
        {/* POST CREATOR HUD */}
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-white/5 p-12 overflow-hidden transition-all hover:shadow-2xl">
          <div className="flex items-center gap-6 mb-10 border-b-2 border-slate-50 dark:border-white/5 pb-8">
            <div className="h-20 w-20 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-3xl shadow-xl">
              {profile?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Draft an Update</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Global Broadcast System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <select value={form.visibility} onChange={e => setForm({...form, visibility: e.target.value})} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer transition-all">
                  <option value="internal">🔒 Internal Network Only</option>
                  <option value="public">🌍 Public Corporate Hub</option>
               </select>
               <select value={form.post_type} onChange={e => setForm({...form, post_type: e.target.value})} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer transition-all">
                  {POST_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
               </select>
            </div>

            <input
              type="text" placeholder="Enter headline..." value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-10 py-6 rounded-3xl outline-none focus:border-blue-500 font-black text-2xl text-slate-900 dark:text-white transition-all"
            />
            <textarea
              placeholder="Detailed communication..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows="4"
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-10 py-8 rounded-3xl outline-none focus:border-blue-500 font-medium text-xl text-slate-700 dark:text-slate-200 resize-none transition-all"
            />

            <div className="flex flex-col md:flex-row items-center gap-6">
              <label className="cursor-pointer bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 transition-all border-2 border-transparent hover:border-slate-300">
                📸 Attach Media (Img/Vid)
                <input type="file" accept="image/*,video/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && <div className="relative h-20 w-32 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg animate-in zoom-in-95 bg-black">
                {selectedImage?.type?.startsWith("video") ? (
                  <video src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                )}
                <button type="button" onClick={() => {setImagePreview(""); setSelectedImage(null)}} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">×</button>
              </div>}
              
              <button type="submit" disabled={loading} className="md:ml-auto w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                {loading ? "Transmitting..." : editingId ? "Update Feed" : "Publish Global Update"}
              </button>
            </div>
            {(error || message) && <div className={`p-6 rounded-2xl text-xs font-black uppercase tracking-widest border-2 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{error || message}</div>}
          </form>
        </div>

        {/* FEED NAVIGATION */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {["All News", "Internal", "Public Hub", "Campaigns"].map((tab, idx) => {
            const keys = ["all", "internal", "public", "campaigns"]
            const isActive = filter === keys[idx]
            return (
              <button key={keys[idx]} onClick={() => setFilter(keys[idx])} className={`whitespace-nowrap px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl scale-105" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-white/5"}`}>
                {tab}
              </button>
            )
          })}
        </div>

        {/* FEED TIMELINE */}
        <div className="space-y-12">
          {filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              user={user} 
              profile={profile}
              onLike={handleToggleLike}
              onCommentToggle={(id) => setExpandedComments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onShare={async (id) => {
                const url = `${window.location.origin}/feed?post=${id}`
                if (navigator.share) await navigator.share({ title: 'CorpLink Post', url })
                else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
              }}
              onEdit={(p) => { 
                setEditingId(p.id); 
                setForm({ title: p.title, content: p.content, visibility: p.visibility, post_type: p.post_type }); 
                setImagePreview(p.media_url); 
                window.scrollTo({ top: 0, behavior: "smooth" }); 
              }}
              onDelete={async (id) => {
                if (window.confirm("Delete permanently?")) {
                  await supabase.from("announcements").delete().eq("id", id)
                  fetchPosts()
                }
              }}
              expandedComments={expandedComments}
              commentInput={commentInputs[post.id]}
              onCommentChange={(id, val) => setCommentInputs({ ...commentInputs, [id]: val })}
              onCommentSubmit={handleAddComment}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default Feed