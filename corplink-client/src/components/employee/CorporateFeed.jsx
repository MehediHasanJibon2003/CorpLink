import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Radio,
  Heart,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Calendar,
  Filter,
  ChevronDown,
  Send,
  X,
  ThumbsUp,
  Award,
  Zap,
  MoreHorizontal,
  Clock,
  Share2,
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/50 rounded-[2rem] ${className}`} />
  );
}

// ─── Time Ago ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Post Type Config ──────────────────────────────────────────────
const typeConfig = {
  announcement: {
    label: "Announcement",
    class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    icon: Megaphone,
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  event: {
    label: "Corporate Event",
    class: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    icon: Calendar,
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  promotion: {
    label: "Growth & Promo",
    class: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    icon: Zap,
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  general: {
    label: "Internal Post",
    class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    icon: Radio,
    gradient: "from-slate-500/10 to-slate-700/10",
  },
};

// ─── Comment Section ───────────────────────────────────────────────
function CommentSection({ postId, user, profile }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("post_comments")
      .select(`
        id, content, created_at, employee_id,
        author:profiles!employee_id (
          full_name,
          role
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert([
          {
            post_id: postId,
            employee_id: user.id,
            content: newComment.trim(),
            company_id: profile.company_id,
          },
        ])
        .select(`
          id, content, created_at, employee_id,
          author:profiles!employee_id (
            full_name,
            role
          )
        `)
        .single();
      
      if (data) setComments((prev) => [...prev, data]);
      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-10 pt-10 border-t-2 border-slate-100 dark:border-slate-800 space-y-8">
      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <>
          <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {comments.length === 0 ? (
              <p className="text-center text-slate-400 font-bold italic py-4">Be the first to comment on this briefing.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-4 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-400 text-body shrink-0">
                    {c.author?.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] px-6 py-4 border-2 border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-800 transition-all">
                    <div className="flex items-center justify-between mb-1">
                       <span className="font-black text-slate-800 dark:text-slate-100 text-body">{c.author?.full_name || "Member"}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-body md:text-body text-slate-600 dark:text-slate-300 font-medium">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleComment} className="flex gap-4">
            <div className="flex-1 relative">
               <input
                 type="text"
                 value={newComment}
                 onChange={(e) => setNewComment(e.target.value)}
                 placeholder="Contribute to the discussion..."
                 className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-full text-slate-800 dark:text-white font-bold outline-none focus:border-blue-500 transition-all"
               />
            </div>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black uppercase tracking-widest transition shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-6 w-6" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────
function PostCard({ post, user, profile }) {
  const [reactions, setReactions] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [reacting, setReacting] = useState(false);

  const tConf = typeConfig[post.type] || typeConfig.general;
  const TypeIcon = tConf.icon;

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from("post_reactions")
      .select("type, employee_id")
      .eq("post_id", post.id);
    setReactions(data || []);
  }, [post.id]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggleReaction = async (type = "like") => {
    if (reacting) return;
    setReacting(true);
    const existing = reactions.find(r => r.employee_id === user.id && r.type === type);
    
    try {
      if (existing) {
        await supabase.from("post_reactions").delete().eq("post_id", post.id).eq("employee_id", user.id).eq("type", type);
        setReactions(prev => prev.filter(r => !(r.employee_id === user.id && r.type === type)));
      } else {
        const { data } = await supabase.from("post_reactions").insert([{
          post_id: post.id,
          employee_id: user.id,
          type: type,
          company_id: profile.company_id
        }]).select().single();
        if (data) setReactions(prev => [...prev, data]);
      }
    } catch (err) {
      console.error("Reaction Error:", err);
    }
    setReacting(false);
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const myReactions = reactions.filter(r => r.employee_id === user.id).map(r => r.type);

  return (
    <div className={`relative border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-[3rem] p-10 md:p-14 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${tConf.gradient} -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-black text-heading-1 md:text-heading-1 text-slate-800 dark:text-white shadow-inner">
            {(post.author?.full_name || "A").charAt(0)}
          </div>
          <div>
            <h4 className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white tracking-tight">
              {post.author?.full_name || "Corporate Admin"}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
               <span className="text-[10px] md:text-label font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{post.author?.role || "Announcement Hub"}</span>
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
               <span className="text-[10px] md:text-label font-bold text-slate-400 uppercase tracking-widest">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className={`px-6 py-2.5 rounded-full flex items-center gap-3 border-2 border-transparent ${tConf.class} shadow-sm`}>
           <TypeIcon className="h-5 w-5" />
           <span className="text-label md:text-body font-black uppercase tracking-widest">{tConf.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="relative space-y-6">
        {post.title && (
          <h2 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
            {post.title}
          </h2>
        )}
        <p className="text-heading-3 md:text-heading-1 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {post.content}
        </p>

        {post.media_url && (
          <div className="rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-lg bg-black">
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                controls 
                className="w-full max-h-[600px] outline-none"
                poster="/video-placeholder.png" // Optional placeholder
              />
            ) : (
              <img 
                src={post.media_url} 
                alt="Update Visual" 
                className="w-full h-auto object-cover max-h-[600px] hover:scale-105 transition-transform duration-700" 
              />
            )}
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="relative mt-12 pt-8 border-t-2 border-slate-50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          {[
            { type: 'like', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { type: 'love', icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { type: 'clap', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { type: 'insight', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' }
          ].map(r => {
            const count = reactionCounts[r.type] || 0;
            const isMine = myReactions.includes(r.type);
            const Icon = r.icon;
            return (
              <button 
                key={r.type} 
                onClick={() => toggleReaction(r.type)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all active:scale-90 ${isMine ? `${r.bg} ${r.color} ring-2 ring-current ring-offset-2 dark:ring-offset-slate-800` : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500'}`}
              >
                <Icon className={`h-5 w-5 ${isMine ? 'fill-current' : ''}`} />
                <span className="font-black text-body">{count > 0 ? count : ''}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-6">
           <button 
             onClick={() => setShowComments(!showComments)}
             className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${showComments ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
           >
              <MessageCircle className="h-6 w-6" />
              <span>Discussion</span>
           </button>
           <button className="p-4 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Share2 className="h-6 w-6" />
           </button>
        </div>
      </div>

      {showComments && <CommentSection postId={post.id} user={user} profile={profile} />}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
function CorporateFeed() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFeed = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Primary Attempt: Fetch Announcements with Profile Join
      const { data, error: err } = await supabase
        .from("announcements")
        .select(`
          id, title, content, type, created_at, created_by,
          media_url, media_type,
          author:profiles!created_by (
            full_name,
            role
          )
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) {
        console.warn("Primary feed fetch failed, attempting fallback...", err);
        // 2. Fallback: Fetch without join
        const { data: fallbackData, error: fErr } = await supabase
          .from("announcements")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (fErr) throw fErr;
        setPosts(fallbackData || []);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error("CorporateFeed error:", err);
      setError("Strategic Feed Synchronization Failed.");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const filteredPosts = typeFilter === "all" ? posts : posts.filter((p) => p.type === typeFilter);

  const filterTabs = [
    { value: "all", label: "Intelligence Feed", icon: Radio },
    { value: "announcement", label: "Strategic Briefings", icon: Megaphone },
    { value: "event", label: "Operational Events", icon: Calendar },
    { value: "promotion", label: "Growth & Scaling", icon: Zap },
  ];

  return (
    <div className="space-y-12 md:space-y-20 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-4 border-slate-100 dark:border-slate-800 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-emerald-600 font-black uppercase tracking-[0.4em] text-body">
             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
             Live Stream
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Corporate <br />
            <span className="text-emerald-500 drop-shadow-sm">Intelligence</span>
          </h1>
          <p className="text-heading-2 md:text-heading-1 text-slate-500 dark:text-slate-400 font-bold max-w-2xl leading-tight">
            Centralized hub for strategic updates, promotions, and organizational transparency.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="group flex items-center gap-4 px-10 py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
        >
          <RefreshCw className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
          Refresh Pulse
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = typeFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`flex flex-col items-start gap-4 p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${
                isActive
                  ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 shadow-2xl scale-105"
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500/50"
              }`}
            >
              <Icon className={`h-8 w-8 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className={`text-body md:text-heading-3 font-black uppercase tracking-widest ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Dynamic Content Stream */}
      <div className="max-w-6xl mx-auto space-y-16">
        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[500px] w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border-4 border-red-200 dark:border-red-900 rounded-[3rem] p-16 text-center">
            <AlertCircle className="h-24 w-24 text-red-500 mx-auto mb-8" />
            <h2 className="text-heading-1 font-black text-red-700 dark:text-red-400 uppercase tracking-widest">{error}</h2>
            <button onClick={() => setRefreshKey(k=>k+1)} className="mt-8 px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase">Retry Connection</button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[4rem] flex flex-col items-center justify-center py-40 text-center px-8">
            <Radio className="h-32 w-32 text-slate-200 dark:text-slate-700 mb-10" />
            <h3 className="font-black text-slate-600 dark:text-slate-400 text-heading-1 md:text-heading-1 uppercase tracking-[0.2em]">Zero Signal Detected</h3>
            <p className="text-heading-2 md:text-heading-1 text-slate-400 mt-4 max-w-lg font-bold">The frequency for this briefing category is currently silent. Stand by for future updates.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} user={user} profile={profile} />
          ))
        )}
      </div>
    </div>
  );
}

export default CorporateFeed;

