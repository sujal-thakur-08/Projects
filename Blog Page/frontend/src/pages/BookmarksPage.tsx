import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

export function BookmarksPage() {
  const { fetchBookmarks } = useAuth();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);

  useEffect(() => {
    void fetchBookmarks().then(setBookmarks);
  }, [fetchBookmarks]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Saved articles for later reading.</p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {bookmarks.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}