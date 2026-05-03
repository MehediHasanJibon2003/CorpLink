import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"

const POST_TYPES = [
  { value: "announcement", label: "Announcement", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "promotion", label: "Product Promotion", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "event", label: "Event / Campaign", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "internal", label: "Internal Alert", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700" }
]

function Feed() {
  const { user, profile } = useAuth()

  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState("all") // all, internal, public, campaigns
  
  // Form State
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState("internal")
  const [postType, setPostType] = useState("announcement")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [expandedComments, setExpandedComments] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [commentInputs, setCommentInputs] = useState({})

  const fetchPosts = async () => {
    setError("")

    // Fetch posts with company names joined
    const { data: announcementsData, error: announcementsError } = await supabase
      .from("announcements")
      .select("*, companies(name)")
      .order("created_at", { ascending: false })

    if (announcementsError) {
      setError(announcementsError.message)
      return
    }

    const { data: likesData } = await supabase.from("announcement_likes").select("*")
    const { data: commentsData } = await supabase.from("announcement_comments").select("*").order("created_at", { ascending: true })

    const mergedPosts = (announcementsData || []).map((post) => {
      const postLikes = (likesData || []).filter((like) => like.announcement_id === post.id)
      const postComments = (commentsData || []).filter((comment) => comment.announcement_id === post.id)
      const likedByMe = postLikes.some((like) => like.user_id === user?.id)

      return {
        ...post,
        likesCount: postLikes.length,
        commentsCount: postComments.length,
        comments: postComments,
        likedByMe,
      }
    })

    setPosts(mergedPosts)
  }

  useEffect(() => {
    if (user?.id) fetchPosts()
  }, [user?.id])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedImage(null)
      setImagePreview("")
      return
    }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file) => {
    if (!file) return null
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `posts/${fileName}`
    const { error: uploadError } = await supabase.storage.from("feed-images").upload(filePath, file)
    if (uploadError) throw new Error(uploadError.message)
    const { data } = supabase.storage.from("feed-images").getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!title.trim() || !content.trim()) { setError("Title and content are required"); return }
    if (!profile?.company_id || !user?.id) return

    setLoading(true)

    try {
      let imageUrl = null
      if (selectedImage) imageUrl = await uploadImage(selectedImage)

      if (editingId) {
        const payload = {
          title: title.trim(),
          content: content.trim(),
          visibility: visibility,
          post_type: postType,
        }
        if (imageUrl) payload.image_url = imageUrl

        const { error } = await supabase.from("announcements").update(payload).eq("id", editingId)
        if (error) throw new Error(error.message)
        setMessage("Post updated successfully!")
        
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: "Updated a corporate feed post", entity: "announcement", severity: "info"
        })
      } else {
        const { error } = await supabase.from("announcements").insert([{
          company_id: profile.company_id,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          visibility: visibility,
          post_type: postType,
          created_by: user.id,
        }])
        if (error) throw new Error(error.message)
        setMessage("Post created successfully!")
        
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: "Published a new post to the feed", entity: "announcement", severity: "info"
        })
      }

      setTitle(""); setContent(""); setVisibility("internal"); setPostType("announcement")
      setSelectedImage(null); setImagePreview(""); setEditingId(null)
      fetchPosts()
    } catch (err) {
      setError(err.message || "Failed to post")
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleEdit = (post) => {
    setEditingId(post.id)
    setTitle(post.title || "")
    setContent(post.content || "")
    setVisibility(post.visibility || "internal")
    setPostType(post.post_type || "announcement")
    setSelectedImage(null)
    setImagePreview(post.image_url || "")
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return
    setError(""); setMessage("")
    
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) {
      setError(error.message)
    } else {
      setMessage("Post deleted.")
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: "Deleted a feed post", entity: "announcement", severity: "warning"
      })
      fetchPosts()
    }
  }

  // Optimistic UI updates for likes to make it feel fast
  const handleToggleLike = async (post) => {
    // 1. Optimistically update local state
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likedByMe: !p.likedByMe,
          likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1
        }
      }
      return p
    }))

    // 2. Perform DB operation in background
    if (post.likedByMe) {
      await supabase.from("announcement_likes")
        .delete()
        .match({ announcement_id: post.id, user_id: user.id })
    } else {
      await supabase.from("announcement_likes").insert([{
        announcement_id: post.id,
        company_id: profile.company_id,
        user_id: user.id,
      }])
      
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: "Liked a post", entity: "announcement", severity: "info"
      })
    }
  }

  // Optimistic UI for comments
  const handleAddComment = async (post) => {
    const text = commentInputs[post.id]?.trim()
    if (!text || !user?.id) return

    // Immediately update UI count
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...p.comments, { id: 'temp', comment_text: text, created_at: new Date().toISOString() }]
        }
      }
      return p
    }))
    
    // Clear input
    setCommentInputs(prev => ({ ...prev, [post.id]: "" }))

    // DB Insert
    await supabase.from("announcement_comments").insert([{
      announcement_id: post.id,
      company_id: profile.company_id,
      user_id: user.id,
      comment_text: text,
    }])
    
    await logAdminActivity({
      company_id: profile.company_id, user_id: user.id,
      action: "Commented on a post", entity: "announcement", severity: "info"
    })
    
    // Silent re-fetch
    fetchPosts()
  }

  const toggleComments = (postId) => {
    setExpandedComments(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    )
    
    // Optional: focus the input after opening
    setTimeout(() => {
      if (!expandedComments.includes(postId)) {
        document.getElementById(`comment-${postId}`)?.focus()
      }
    }, 100)
  }

  // Modern robust Share approach
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/feed?post=${postId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CorpLink Post', url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert("Link copied to clipboard!")
      }
      
      // Bonus: Increment views slightly upon interaction as an analytics simulation
      const post = posts.find(p => p.id === postId)
      if (post) {
        await supabase.from("announcements").update({ views_count: (post.views_count || 0) + 1 }).eq("id", postId)
      }
      
    } catch (err) {
      console.error("Share failed", err)
    }
  }

  // Filter posts logic
  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true
    if (filter === "internal") return post.visibility === "internal" && post.company_id === profile?.company_id
    if (filter === "public") return post.visibility === "public"
    if (filter === "campaigns") return post.post_type === "promotion" || post.post_type === "event"
    return true
  })

  return (
    <AppLayout title="Corporate Feed" subtitle="News, Campaigns & Updates">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-32">
        
        {/* CREATE POST SECTION */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-xl">
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-4 md:gap-6 border-b-2 border-slate-100 dark:border-slate-800 pb-6 md:pb-8 mb-6 md:mb-8">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-lg">
                {profile?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight">Create an Update</h3>
                <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium mt-1">Share with your company or the public</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                <select 
                  value={visibility} onChange={(e) => setVisibility(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 text-base md:text-lg rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 outline-none focus:border-blue-500 font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <option value="internal">🔒 Internal Only</option>
                  <option value="public">🌍 Public (All Companies)</option>
                </select>

                <select 
                  value={postType} onChange={(e) => setPostType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 text-base md:text-lg rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 outline-none focus:border-blue-500 font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {POST_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>

              <input
                type="text" placeholder="Campaign or update title" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-600 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 font-black text-xl md:text-3xl bg-slate-50 dark:bg-slate-900/50 transition-all placeholder:text-slate-400"
              />
              <textarea
                placeholder="Write your corporate update..." value={content} onChange={(e) => setContent(e.target.value)} rows="5"
                className="w-full border-2 border-slate-200 dark:border-slate-600 px-8 py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 resize-none text-lg md:text-2xl font-medium bg-slate-50 dark:bg-slate-900/50 transition-all placeholder:text-slate-400"
              />

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <label className="cursor-pointer flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-8 py-4 md:py-5 rounded-2xl text-base md:text-xl font-bold text-slate-700 dark:text-slate-200 transition-all border-2 border-transparent hover:border-slate-300">
                  <span className="text-2xl">📸</span>
                  <span>Add Media</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && <span className="text-base md:text-lg text-green-600 dark:text-green-400 font-black flex items-center gap-2">✅ Image attached</span>}
                
                <div className="md:ml-auto flex gap-4">
                  {editingId && (
                    <button type="button" onClick={() => {
                      setEditingId(null); setTitle(""); setContent(""); setSelectedImage(null); setImagePreview("")
                    }} className="flex-1 md:flex-none bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl transition-all">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0">
                    {loading ? "Saving..." : editingId ? "Update Post" : "Publish Post"}
                  </button>
                </div>
              </div>
              {(error || message) && (
                <div className={`p-6 rounded-2xl text-base md:text-lg font-bold border-2 ${error ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/50'}`}>
                  {error || message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* FEED FILTER TABS */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {["All News", "Internal", "Public Hub", "Campaigns"].map((tab, idx) => {
            const keys = ["all", "internal", "public", "campaigns"]
            const isActive = filter === keys[idx]
            return (
              <button
                key={keys[idx]}
                onClick={() => setFilter(keys[idx])}
                className={`whitespace-nowrap px-8 py-3 md:py-4 rounded-full text-base md:text-xl font-black transition-all border-2 ${
                  isActive ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-lg scale-105" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* FEED TIMELINE */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 p-16 md:p-24 text-center">
            <div className="text-6xl md:text-8xl mb-6">📰</div>
            <p className="text-xl md:text-3xl text-slate-500 dark:text-slate-400 font-black italic">No posts found for this filter.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const typeConfig = POST_TYPES.find(t => t.value === post.post_type) || POST_TYPES[0]
            
            return (
              <div key={post.id} className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-xl">
                {/* Header */}
                <div className="p-8 md:p-10 flex items-start justify-between border-b-2 border-slate-50 dark:border-slate-700 relative bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-md border-2 border-white dark:border-slate-700">
                      {post.companies?.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white leading-tight">
                          {post.companies?.name || "Corporate User"}
                        </h3>
                        <span className={`px-4 py-1 rounded-full text-xs md:text-sm font-black uppercase tracking-widest border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 font-bold">
                        <span className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                          {new Date(post.created_at).toLocaleDateString([], { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-sm md:text-base text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          {post.visibility === 'public' ? '🌍 Public Hub' : '🔒 Internal Feed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 3-Dot Menu */}
                  {post.created_by === user?.id && (
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none border-2 border-transparent hover:border-slate-200"
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                      </button>
                      
                      {openMenuId === post.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 mt-3 w-56 md:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button 
                              onClick={() => { handleEdit(post); setOpenMenuId(null); }} 
                              className="w-full text-left px-6 py-4 text-lg font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-3 transition-colors"
                            >
                              ✏️ Edit Post
                            </button>
                            <button 
                              onClick={() => { handleDelete(post.id); setOpenMenuId(null); }} 
                              className="w-full text-left px-6 py-4 text-lg font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-8 py-8 md:px-12 md:py-10">
                  <h4 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">{post.title}</h4>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line text-lg md:text-2xl leading-relaxed font-medium">
                    {post.content}
                  </p>
                </div>

                {/* Media */}
                {post.image_url && (
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-y-2 border-slate-100 dark:border-slate-700">
                    <img src={post.image_url} alt={post.title} className="w-full max-h-[600px] object-contain mx-auto" />
                  </div>
                )}

                {/* Analytics & Interaction Bar */}
                <div className="px-8 py-6 md:px-12 border-t-2 border-slate-100 dark:border-slate-700 flex items-center justify-between text-base md:text-xl text-slate-500 dark:text-slate-400 font-black">
                  <div className="flex gap-8 md:gap-12">
                    <span className="flex items-center gap-2">❤️ <span className="text-slate-900 dark:text-white">{post.likesCount}</span></span>
                    <span className="flex items-center gap-2">💬 <span className="text-slate-900 dark:text-white">{post.commentsCount}</span></span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-2xl">📈</span>
                    <span>{Number(post.views_count || 0) + Number(post.likesCount || 0) + Number(post.commentsCount || 0)} <span className="hidden sm:inline">interactions</span></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t-2 border-slate-100 dark:border-slate-700 grid grid-cols-3 divide-x-2 divide-slate-100 dark:divide-slate-700 bg-slate-50/30 dark:bg-slate-900/20">
                  <button onClick={() => handleToggleLike(post)} className={`py-6 md:py-8 flex items-center justify-center gap-3 text-lg md:text-2xl font-black transition-all ${post.likedByMe ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/30" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    <span className="text-2xl md:text-3xl">{post.likedByMe ? '💙' : '🤍'}</span>
                    <span>{post.likedByMe ? 'Liked' : 'Like'}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={`py-6 md:py-8 flex items-center justify-center gap-3 text-lg md:text-2xl font-black transition-all ${expandedComments.includes(post.id) ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/30" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    <span className="text-2xl md:text-3xl">💬</span>
                    <span>Comment</span>
                  </button>
                  <button onClick={() => handleShare(post.id)} className="py-6 md:py-8 flex items-center justify-center gap-3 text-lg md:text-2xl font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <span className="text-2xl md:text-3xl">↗</span>
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Section (Facebook style toggle) */}
                {expandedComments.includes(post.id) && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 border-t-2 border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-4 md:gap-6 mb-8">
                      <input
                        id={`comment-${post.id}`} type="text" placeholder="Write a professional comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post)}
                        className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-8 py-4 md:py-5 rounded-[2.5rem] outline-none focus:border-blue-500 shadow-sm transition-all text-lg md:text-xl font-bold"
                      />
                      <button onClick={() => handleAddComment(post)} className="bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 px-10 py-4 md:py-5 rounded-[2.5rem] font-black text-lg md:text-xl transition-all shadow-md active:scale-95 shrink-0">
                        Post
                      </button>
                    </div>
                    
                    {/* Active Comments Render */}
                    {post.comments.length > 0 && (
                      <div className="space-y-6 md:space-y-8">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4 md:gap-6 group">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-300 mt-1 shadow-inner shrink-0">U</div>
                            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-4 md:px-8 md:py-5 text-lg md:text-xl text-slate-800 dark:text-slate-100 shadow-sm flex-1 font-medium leading-relaxed transition-all group-hover:border-slate-300 dark:group-hover:border-slate-600">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-black text-sm md:text-base text-blue-600 dark:text-blue-400 uppercase tracking-widest">Collaborator</span>
                                <span className="text-[10px] md:text-xs text-slate-400 font-bold">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              {comment.comment_text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}

export default Feed