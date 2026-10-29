import { type ReactNode, useEffect, useState } from 'react';
import { Edit3, Eye, Heart, MessageCircle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { SidebarNav } from '../components/SidebarNav';
import type { Post } from '../types';

function Stat({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="glass-panel rounded-[1.5rem] p-5">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user, fetchMyPosts, fetchBookmarks, fetchLikedPosts } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [liked, setLiked] = useState<Post[]>([]);

  useEffect(() => {
    async function load() {
      const [postsData, bookmarksData, likedData] = await Promise.all([fetchMyPosts(), fetchBookmarks(), fetchLikedPosts()]);
      setMyPosts(postsData);
      setBookmarks(bookmarksData);
      setLiked(likedData);
    }
    void load();
  }, [fetchBookmarks, fetchLikedPosts, fetchMyPosts]);

  const publishedCount = myPosts.filter((post) => post.status === 'published').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <SidebarNav />
        <div className="space-y-8">
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Dashboard</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
                <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Manage drafts, track engagement, and keep your editorial workflow moving.</p>
              </div>
              <Link to="/dashboard/write" className="btn-primary gap-2">
                <PlusCircle className="h-4 w-4" /> Write new post
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="My posts" value={myPosts.length} icon={<Edit3 className="h-4 w-4" />} />
            <Stat label="Published" value={publishedCount} icon={<Eye className="h-4 w-4" />} />
            <Stat label="Bookmarks" value={bookmarks.length} icon={<Heart className="h-4 w-4" />} />
            <Stat label="Liked" value={liked.length} icon={<MessageCircle className="h-4 w-4" />} />
          </section>

          <section className="grid gap-8 xl:grid-cols-2">
            <div className="glass-panel rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent posts</h2>
                <Link to="/dashboard/write" className="text-sm font-medium text-sky-600 dark:text-sky-300">New draft</Link>
              </div>
              <div className="mt-4 space-y-3">
                {myPosts.slice(0, 5).map((post) => (
                  <Link key={post.id} to={`/dashboard/write/${post.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{post.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{post.status} · {post.reading_time_minutes} min read</div>
                    </div>
                    <span className="text-xs text-slate-500">{post.likes_count} likes</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-[1.75rem] p-5">
              <h2 className="text-lg font-semibold">Bookmarked reading</h2>
              <div className="mt-4 space-y-3">
                {bookmarks.slice(0, 5).map((post) => (
                  <Link key={post.id} to={`/posts/${post.slug}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{post.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{post.author_name}</div>
                    </div>
                    <span className="text-xs text-slate-500">{post.bookmarks_count} saved</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}