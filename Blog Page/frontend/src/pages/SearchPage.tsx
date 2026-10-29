import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { api } from '../api/client';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [author, setAuthor] = useState(searchParams.get('author') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [items, setItems] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setTag(searchParams.get('tag') || '');
    setAuthor(searchParams.get('author') || '');
    setCategory(searchParams.get('category') || '');
    setSort(searchParams.get('sort') || 'recent');
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const response = await api.get<{ items: Post[]; total: number }>('/posts', {
        params: {
          q: searchParams.get('q') || undefined,
          tag: searchParams.get('tag') || undefined,
          author: searchParams.get('author') || undefined,
          category: searchParams.get('category') || undefined,
          sort: searchParams.get('sort') || 'recent',
          status: 'published',
        },
      });
      setItems(response.data.items);
      setTotal(response.data.total);
    }
    void load();
  }, [searchParams]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      {
        ...(query ? { q: query } : {}),
        ...(tag ? { tag } : {}),
        ...(author ? { author } : {}),
        ...(category ? { category } : {}),
        ...(sort ? { sort } : {}),
      },
      { replace: true },
    );
  }

  const activeFilters = useMemo(
    () => [query, tag, author, category].filter(Boolean).length,
    [query, tag, author, category],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Search and filter</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Filter by title, tag, author, category, and sort order.</p>
        <form onSubmit={applyFilters} className="mt-6 grid gap-4 md:grid-cols-5">
          <input className="input-shell md:col-span-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts..." />
          <input className="input-shell" value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Tag" />
          <input className="input-shell" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author username" />
          <select className="input-shell" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Recent</option>
            <option value="trending">Trending</option>
            <option value="popular">Popular</option>
          </select>
          <input className="input-shell md:col-span-2" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">{total} results · {activeFilters} active filters</div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}