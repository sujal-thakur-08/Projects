import { type ReactNode, useEffect, useState } from 'react';
import { ArrowRight, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-glass dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{children}</span>;
}

export function HomePage() {
  const [featured, setFeatured] = useState<Post[]>([]);
  const [latest, setLatest] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [featuredResponse, latestResponse, trendingResponse] = await Promise.all([
          api.get<Post[]>('/posts/featured'),
          api.get<{ items: Post[] }>('/posts', { params: { status: 'published', sort: 'recent', limit: 6 } }),
          api.get<{ items: Post[] }>('/posts', { params: { status: 'published', sort: 'trending', limit: 4 } }),
        ]);
        setFeatured(featuredResponse.data);
        setLatest(latestResponse.data.items);
        setTrending(trendingResponse.data.items);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[2rem] border border-white/40 bg-hero-radial p-8 text-white shadow-glass lg:grid-cols-[1.4fr_0.9fr] lg:p-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90">
            <Sparkles className="h-4 w-4" /> AI-powered writing, publishing, and engagement
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Build and ship a modern multi-author blog with AI-assisted publishing.</h1>
            <p className="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">Write rich posts, generate summaries, discover related articles, and moderate comments from one cohesive dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary gap-2 bg-white text-ink-950 hover:bg-sand">
              Start publishing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/search" className="btn-secondary gap-2 border-white/20 bg-white/10 text-white hover:bg-white/15">
              <Search className="h-4 w-4" /> Explore posts
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 pt-2 text-white/90">
            <Pill>JWT auth</Pill>
            <Pill>Rich text editor</Pill>
            <Pill>Nested comments</Pill>
            <Pill>AI summaries</Pill>
            <Pill>Dark mode</Pill>
          </div>
        </div>
        <div className="glass-panel rounded-[1.75rem] p-6 text-slate-900 dark:text-white">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Featured</div>
              <div className="text-xl font-semibold">Trending voices</div>
            </div>
            <TrendingUp className="h-5 w-5 text-ember" />
          </div>
          <div className="space-y-4">
            {loading ? <div className="text-sm text-slate-500">Loading featured posts...</div> : featured.slice(0, 3).map((post) => <PostCard key={post.id} post={post} compact />)}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Latest posts</h2>
            <Link to="/search" className="text-sm font-medium text-sky-600 dark:text-sky-300">See all</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {latest.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
        <aside className="space-y-5">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <h3 className="text-lg font-semibold">Trending now</h3>
            <div className="mt-4 space-y-3">
              {trending.map((post, index) => (
                <Link key={post.id} to={`/posts/${post.slug}`} className="flex items-start gap-3 rounded-2xl p-3 transition hover:bg-slate-100/70 dark:hover:bg-white/5">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-sand dark:text-ink-950">{index + 1}</span>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{post.title}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{post.likes_count} likes · {post.reading_time_minutes} min</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-5">
            <h3 className="text-lg font-semibold">Popular categories</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {['AI', 'Design', 'Engineering', 'Product', 'Writing', 'Tutorials'].map((category) => (
                <Link key={category} to={`/search?category=${encodeURIComponent(category)}`} className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}