export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  role: 'author' | 'admin';
  created_at: string;
  updated_at: string;
  follower_count: number;
  post_count: number;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  content_json?: Record<string, unknown> | null;
  excerpt?: string | null;
  tags: string[];
  category?: string | null;
  cover_image?: string | null;
  status: 'draft' | 'published';
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  summary?: string | null;
  reading_time_minutes: number;
  likes_count: number;
  bookmarks_count: number;
  comments_count: number;
  views_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
};

export type RelatedPost = Pick<Post, 'id' | 'slug' | 'title' | 'excerpt' | 'cover_image' | 'created_at' | 'tags'> & {
  author_name: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url?: string | null;
  content: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  replies: Comment[];
  reported: boolean;
  report_reason?: string | null;
};

export type PostListResponse = {
  items: Post[];
  total: number;
  page: number;
  limit: number;
};

export type SummaryResponse = { summary: string };
export type WritingAssistResponse = { suggestion: string };
export type TagResponse = { tags: string[]; category: string };

export type DashboardStats = {
  posts: number;
  published_posts?: number;
  reported_comments?: number;
  users?: number;
};

export type PostEditorPayload = {
  title: string;
  content_html: string;
  content_json?: Record<string, unknown> | null;
  excerpt?: string;
  tags: string[];
  category?: string;
  cover_image?: string;
  status: 'draft' | 'published';
  ai_summary?: string;
};
