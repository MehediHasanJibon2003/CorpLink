import { useEffect, useState, useRef, memo } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"
import { Eye, Heart, MessageSquare, Share2, Globe, Lock, Megaphone, Calendar, Tag, MoreVertical, Trash2, Edit3, Send, X, Paperclip, Search, Play, ShoppingBag, Gamepad2, Menu, Bell, CheckSquare, Briefcase } from "lucide-react"
import { useConfirm } from "../context/ConfirmContext"

const POST_TYPES = [
  { value: "general", label: "General Update", color: "bg-slate-50 text-slate-700 border-slate-200", icon: <Globe className="h-4 w-4" /> },
  { value: "announcement", label: "Announcement", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Megaphone className="h-4 w-4" /> },
  { value: "promotion", label: "Product Promotion", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Tag className="h-4 w-4" /> },
  { value: "event", label: "Event / Campaign", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <Calendar className="h-4 w-4" /> },
  { value: "internal", label: "Internal Alert", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700", icon: <Lock className="h-4 w-4" /> }
]

// Separate Component for individual Post to handle IntersectionObserver (Auto View Counter)
const PostCard = memo(
  ({
    post,
    user,
    profile,
    onLike,
    onCommentToggle,
    onShare,
    onEdit,
    onDelete,
    expandedComments,
    commentInput,
    onCommentChange,
    onCommentSubmit,
  }) => {
    const cardRef = useRef(null);
    const hasViewed = useRef(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasViewed.current) {
            hasViewed.current = true;
            incrementView(post.id);
          }
        },
        { threshold: 0.5 },
      );

      if (cardRef.current) observer.observe(cardRef.current);
      return () => observer.disconnect();
    }, [post.id]);

    const incrementView = async (postId) => {
      try {
        await supabase.rpc("increment_announcement_views", {
          announcement_id: postId,
        });
      } catch (e) {
        // Fallback if RPC doesn't exist
        await supabase
          .from("announcements")
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq("id", postId);
      }
    };

    const typeConfig =
      POST_TYPES.find((t) => t.value === post.post_type) || POST_TYPES[0];
    const isAuthor = post.created_by === user?.id;
    const isExpanded = expandedComments.includes(post.id);

    return (
      <div
        ref={cardRef}
        className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:border-blue-500/20 group animate-in fade-in slide-in-from-bottom-8 duration-500"
      >
        {/* Header */}
        <div className="p-8 md:p-10 flex items-start justify-between border-b-2 border-slate-50 dark:border-slate-900/50 bg-slate-50/30 dark:bg-slate-900/20">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-heading-1 md:text-heading-1 shadow-lg border-2 border-white dark:border-slate-700 group-hover:scale-105 transition-transform">
              {post.companies?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-black text-heading-1 md:text-heading-1 text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {post.companies?.name || "Corporate Entity"}
                </h3>
                <span
                  className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${typeConfig.color}`}
                >
                  {typeConfig.icon} {typeConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 font-black text-[10px] uppercase tracking-widest text-slate-400">
                <span>
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-slate-200 dark:text-slate-700">|</span>
                <span
                  className={`flex items-center gap-1.5 ${post.visibility === "public" ? "text-emerald-500" : "text-blue-500"}`}
                >
                  {post.visibility === "public" ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {post.visibility === "public"
                    ? "Public Hub"
                    : "Internal Feed"}
                </span>
              </div>
            </div>
          </div>

          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(post)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500 transition-all"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`py-10 md:px-16 ${post.post_type === 'general' ? 'px-10' : 'px-10'}`}>
          {post.title && post.post_type !== 'general' && (
            <h4 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              {post.title}
            </h4>
          )}
          <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line text-heading-3 md:text-heading-1 leading-relaxed font-medium opacity-90">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="w-full bg-slate-50 dark:bg-slate-900 border-y-2 border-slate-100 dark:border-white/5 bg-black">
            {post.media_type === "video" ? (
              <video
                src={post.media_url}
                controls
                className="w-full max-h-[700px] outline-none mx-auto"
              />
            ) : (
              <img
                src={post.media_url}
                alt={post.title}
                className="w-full max-h-[700px] object-contain mx-auto"
              />
            )}
          </div>
        )}

        {/* Engagement Summary */}
        <div className="px-10 py-6 md:px-16 border-t-2 border-slate-50 dark:border-white/5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex gap-8">
            <span className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <Heart
                className={`h-4 w-4 ${post.likedByMe ? "fill-red-500 text-red-500" : ""}`}
              />{" "}
              {post.likesCount}{" "}
              <span className="hidden sm:inline">Reactions</span>
            </span>
            <span className="flex items-center gap-2 hover:text-blue-500 transition-colors">
              <MessageSquare className="h-4 w-4" /> {post.commentsCount}{" "}
              <span className="hidden sm:inline">Comments</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-500">
            <Eye className="h-4 w-4 text-blue-500" /> {post.views_count || 0}{" "}
            <span className="hidden sm:inline">Total Views</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 divide-x-2 divide-slate-100 dark:divide-white/5 border-t-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => onLike(post)}
            className={`py-6 flex items-center justify-center gap-3 text-label font-black uppercase tracking-widest transition-all ${post.likedByMe ? "text-red-500 bg-red-50/30 dark:bg-red-900/20" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"}`}
          >
            <Heart
              className={`h-5 w-5 ${post.likedByMe ? "fill-red-500" : ""}`}
            />{" "}
            {post.likedByMe ? "Liked" : "Like"}
          </button>
          <button
            onClick={() => onCommentToggle(post.id)}
            className={`py-6 flex items-center justify-center gap-3 text-label font-black uppercase tracking-widest transition-all ${isExpanded ? "text-blue-600 bg-blue-50/30 dark:bg-blue-900/20" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"}`}
          >
            <MessageSquare className="h-5 w-5" /> Comment
          </button>
          <button
            onClick={() => onShare(post.id)}
            className="py-6 flex items-center justify-center gap-3 text-label font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:hover:bg-white/5 transition-all"
          >
            <Share2 className="h-5 w-5" /> Share
          </button>
        </div>

        {/* Comments Section */}
        {isExpanded && (
          <div className="p-10 md:p-16 border-t-2 border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex gap-4 mb-10">
              <input
                type="text"
                placeholder="Add a corporate response..."
                value={commentInput || ""}
                onChange={(e) => onCommentChange(post.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCommentSubmit(post)}
                className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 px-8 py-5 rounded-2xl md:rounded-[2rem] outline-none focus:border-blue-500 shadow-sm text-heading-3 font-bold"
              />
              <button
                onClick={() => onCommentSubmit(post)}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl md:rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8">
              {post.comments.length === 0 ? (
                <p className="text-center text-slate-400 font-bold italic py-4">
                  No discussions yet. Be the first to reply.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-5 group">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-400 shrink-0 shadow-inner">
                      {comment.id === "temp" ? "..." : "U"}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm group-hover:border-blue-500/20 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                            Team Collaborator
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-heading-3 text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

function Feed() {
  const { user, profile } = useAuth();
  const { showConfirm } = useConfirm();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({ title: "", content: "", visibility: "internal", post_type: "general" })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [expandedComments, setExpandedComments] = useState([])
  const [commentInputs, setCommentInputs] = useState({})

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchPosts = async () => {
    let query = supabase
      .from("announcements")
      .select("*, companies(name)")
      .order("created_at", { ascending: false });
    if (profile?.role !== "super_admin" && profile?.company_id) {
      query = query.or(
        `visibility.eq.public,and(visibility.eq.internal,company_id.eq.${profile.company_id})`,
      );
    }
    const { data: announcementsData } = await query;
    const { data: likesData } = await supabase
      .from("announcement_likes")
      .select("*");
    const { data: commentsData } = await supabase
      .from("announcement_comments")
      .select("*")
      .order("created_at", { ascending: true });

    const mergedPosts = (announcementsData || []).map((post) => {
      const postLikes = (likesData || []).filter(
        (l) => l.announcement_id === post.id,
      );
      const postComments = (commentsData || []).filter(
        (c) => c.announcement_id === post.id,
      );
      return {
        ...post,
        likesCount: postLikes.length,
        commentsCount: postComments.length,
        comments: postComments,
        likedByMe: postLikes.some((l) => l.user_id === user?.id),
      };
    });
    setPosts(mergedPosts);
  };

  useEffect(() => {
    if (user?.id) fetchPosts();
  }, [user?.id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedImage(null);
      setImagePreview("");
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadMedia = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `posts/${fileName}`;
    const { error } = await supabase.storage
      .from("feed-images")
      .upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("feed-images")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.content.trim()) return
    setLoading(true)
    setError("")
    
    try {
      const finalTitle = form.title.trim() || (form.content.trim().slice(0, 40) + "...")
      let mediaUrl = imagePreview
      let mediaType = selectedImage 
        ? (selectedImage.type?.startsWith("video") ? "video" : "image")
        : (editingId ? posts.find(p => p.id === editingId)?.media_type : "image")
      
      if (selectedImage) {
        mediaUrl = await uploadMedia(selectedImage)
      }

      const payload = { 
        ...form,
        title: finalTitle,
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
      
      setForm({ title: "", content: "", visibility: "internal", post_type: "general" })
      setSelectedImage(null); setImagePreview(""); setEditingId(null)
      fetchPosts()
      setShowModal(false)
    } catch (err) { 
      console.error("Submit Error:", err)
      setError(err.message) 
    }
    setLoading(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleToggleLike = async (post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    );
    if (post.likedByMe) {
      await supabase
        .from("announcement_likes")
        .delete()
        .match({ announcement_id: post.id, user_id: user.id });
    } else {
      await supabase
        .from("announcement_likes")
        .insert([
          {
            announcement_id: post.id,
            company_id: profile.company_id,
            user_id: user.id,
          },
        ]);
    }
  };

  const handleAddComment = async (post) => {
    const text = commentInputs[post.id]?.trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [
                ...p.comments,
                {
                  id: "temp",
                  comment_text: text,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : p,
      ),
    );
    setCommentInputs((prev) => ({ ...prev, [post.id]: "" }));
    await supabase
      .from("announcement_comments")
      .insert([
        {
          announcement_id: post.id,
          company_id: profile.company_id,
          user_id: user.id,
          comment_text: text,
        },
      ]);
    fetchPosts();
  };

  const filteredPosts = posts.filter((post) => {
    // 1. Category Filtering Logic
    let matchesCategory = true;
    if (filter === "internal") {
      matchesCategory = post.visibility === "internal" && post.company_id === profile?.company_id;
    } else if (filter === "public") {
      matchesCategory = post.visibility === "public";
    } else if (filter === "campaigns") {
      matchesCategory = post.post_type === "promotion" || post.post_type === "event";
    }

    // 2. Search Query Logic
    const matchesSearch = 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      {/* FACEBOOK-STYLE WIDE SECONDARY NAVBAR (FEED ONLY) */}
      <div className="sticky top-0 z-[60] bg-white/95 dark:bg-[#0d0622]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-4 md:px-8 py-2 -mx-4 md:-mx-8 lg:-mx-12 flex items-center justify-between shadow-sm mb-10">
        {/* Left: Search */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <span className="font-black text-xl italic">C</span>
          </div>
          <div className="relative max-w-[280px] hidden lg:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search CorpLink" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Center: Icons (Corporate Relatable) */}
        <div className="flex items-center gap-1 md:gap-4 flex-1 justify-center h-full max-w-xl">
           <button 
             onClick={() => setFilter("all")}
             className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all ${filter === "all" ? "text-blue-600 border-b-[4px] border-blue-600 bg-blue-50/30 dark:bg-blue-500/5" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
           >
              <Globe className="h-6 w-6" />
           </button>
           <button 
             onClick={() => setFilter("internal")}
             className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all ${filter === "internal" ? "text-blue-600 border-b-[4px] border-blue-600 bg-blue-50/30 dark:bg-blue-500/5" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
           >
              <Lock className="h-6 w-6" />
           </button>
           <button 
             onClick={() => setFilter("public")}
             className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all ${filter === "public" ? "text-blue-600 border-b-[4px] border-blue-600 bg-blue-50/30 dark:bg-blue-500/5" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
           >
              <Briefcase className="h-6 w-6" />
           </button>
           <button 
             onClick={() => setFilter("campaigns")}
             className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all ${filter === "campaigns" ? "text-blue-600 border-b-[4px] border-blue-600 bg-blue-50/30 dark:bg-blue-500/5" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
           >
              <Megaphone className="h-6 w-6" />
           </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-[200px]">
           <button className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
              <Menu className="h-5 w-5" />
           </button>
           <button className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-slate-900">3</span>
           </button>
           <button className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-slate-900">1</span>
           </button>
           <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md cursor-pointer hover:scale-105 transition-transform border-2 border-white dark:border-slate-800">
              {profile?.full_name?.charAt(0)?.toUpperCase()}
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-10 pb-32 -mt-6 px-4 md:px-8">

        
        {/* META-STYLE POST CREATOR TRIGGER */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2rem] shadow-sm border-2 border-slate-100 dark:border-white/5 p-4 md:p-6 mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-heading-3 md:text-heading-2 shadow-md shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <button 
              onClick={() => { setEditingId(null); setForm({ title: "", content: "", visibility: "internal", post_type: "general" }); setShowModal(true); }}
              className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 text-left px-5 md:px-6 py-2.5 md:py-3.5 rounded-full text-body md:text-heading-3 font-medium transition-all"
            >
              What's on your mind, {profile?.full_name?.split(' ')[0]}?
            </button>
          </div>
          
        </div>

        {/* META-STYLE CREATE POST MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <div className="w-8" /> {/* Spacer */}
                <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Post</h3>
                <button 
                  onClick={() => { setShowModal(false); setEditingId(null); setSelectedImage(null); setImagePreview(""); }}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* User Identity */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-heading-2 shadow-lg">
                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-body md:text-heading-3 text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{profile?.full_name}</h4>
                    <div className="flex gap-2 mt-1.5">
                       <select value={form.visibility} onChange={e => setForm({...form, visibility: e.target.value})} className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer">
                          <option value="internal">🔒 Internal</option>
                          <option value="public">🌍 Public</option>
                       </select>
                       <select value={form.post_type} onChange={e => setForm({...form, post_type: e.target.value})} className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer">
                          {POST_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                       </select>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text" 
                    placeholder="Enter post headline..." 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-transparent border-none px-0 py-2 outline-none font-black text-heading-2 md:text-heading-1 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700"
                  />
                  
                  <textarea
                    placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0]}?`}
                    value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})} 
                    rows="5"
                    className="w-full bg-transparent border-none px-0 py-2 outline-none font-medium text-body md:text-heading-3 text-slate-700 dark:text-slate-200 resize-none custom-scrollbar"
                  />

                  {/* Media Preview Container */}
                  {(imagePreview || selectedImage) && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/40 group max-h-[300px]">
                      {selectedImage?.type?.startsWith("video") || (editingId && posts.find(p => p.id === editingId)?.media_type === 'video') ? (
                        <video src={imagePreview} className="w-full h-full object-contain" controls />
                      ) : (
                        <img src={imagePreview} className="w-full h-full object-contain" />
                      )}
                      <button 
                        type="button" 
                        onClick={() => {setImagePreview(""); setSelectedImage(null)}} 
                        className="absolute top-3 right-3 bg-white dark:bg-slate-900 shadow-xl text-slate-900 dark:text-white p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Add to your post bar */}
                  <div className="mt-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] md:text-label font-black uppercase tracking-widest text-slate-500">Add to your post</span>
                    <div className="flex items-center gap-1 md:gap-2">
                       <label className="p-2 md:p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer group">
                          <Paperclip className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <input type="file" accept="image/*,video/*" onChange={handleImageChange} className="hidden" />
                       </label>
                       <button type="button" className="p-2 md:p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
                          <Tag className="h-5 w-5 md:h-6 md:w-6 text-blue-500 group-hover:scale-110 transition-transform" />
                       </button>
                       <button type="button" className="p-2 md:p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
                          <Calendar className="h-5 w-5 md:h-6 md:w-6 text-orange-500 group-hover:scale-110 transition-transform" />
                       </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !form.content.trim()} 
                    className={`w-full mt-4 py-3 md:py-4 rounded-xl font-black uppercase text-label tracking-[0.2em] transition-all ${
                      form.content.trim() && !loading
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-[0.98]" 
                        : "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Publishing..." : editingId ? "Update Post" : "Post"}
                  </button>
                </form>
                {(error || message) && (
                  <div className={`mt-4 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {error || message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* FEED TIMELINE */}
        <div className="space-y-12">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              profile={profile}
              onLike={handleToggleLike}
              onCommentToggle={(id) =>
                setExpandedComments((prev) =>
                  prev.includes(id)
                    ? prev.filter((i) => i !== id)
                    : [...prev, id],
                )
              }
              onShare={async (id) => {
                const url = `${window.location.origin}/feed?post=${id}`;
                if (navigator.share)
                  await navigator.share({ title: "CorpLink Post", url });
                else {
                  await navigator.clipboard.writeText(url);
                  alert("Link copied!");
                }
              }}
              onEdit={(p) => { 
                setEditingId(p.id); 
                setForm({ title: p.title, content: p.content, visibility: p.visibility, post_type: p.post_type }); 
                setImagePreview(p.media_url); 
                setShowModal(true);
              }}
              onDelete={(id) => {
                showConfirm({
                  title: "Delete Post",
                  message:
                    "Are you sure you want to permanently delete this post?",
                  onConfirm: async () => {
                    await supabase.from("announcements").delete().eq("id", id);
                    fetchPosts();
                  },
                });
              }}
              expandedComments={expandedComments}
              commentInput={commentInputs[post.id]}
              onCommentChange={(id, val) =>
                setCommentInputs({ ...commentInputs, [id]: val })
              }
              onCommentSubmit={handleAddComment}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Feed;
