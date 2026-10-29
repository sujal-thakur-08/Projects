import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { api } from '../api/client';
import { PostCard } from '../components/PostCard';
import type { Post, User } from '../types';

export function AuthorPage() {
  const { username } = useParams();
  const [author, setAuthor] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function load() {
      if (!username) return;
      const [authorResponse, postsResponse] = await Promise.all([
        api.get<User>(`/users/${username}`),
        api.get<{ items: Post[] }>('/posts', { params: { author: username, status: 'published', limit: 12 } }),
      ]);
      setAuthor(authorResponse.data);
      setPosts(postsResponse.data.items);
    }
    void load();
  }, [username]);

  if (!author) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500 dark:text-slate-400">Loading author profile...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[2rem] p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-slate-950 text-3xl font-semibold text-white dark:bg-sand dark:text-ink-950">{author.name.slice(0, 1)}</div>
          <div className="space-y-2">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Author profile</div>
            <h1 className="text-4xl font-semibold tracking-tight">{author.name}</h1>
            <p className="text-slate-600 dark:text-slate-300">@{author.username} · {author.post_count} posts · {author.follower_count} followers</p>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{author.bio || 'This author has not written a bio yet.'}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Published posts</h2>
          <Link to={`/search?author=${author.username}`} className="text-sm font-medium text-sky-600 dark:text-sky-300">Search by author</Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>
    </div>
  );
}