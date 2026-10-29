import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';
import type { AuthResponse, Post, PostEditorPayload, User } from '../types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  updateUser: (payload: Partial<User>) => Promise<User>;
  fetchMyPosts: () => Promise<Post[]>;
  fetchBookmarks: () => Promise<Post[]>;
  fetchLikedPosts: () => Promise<Post[]>;
  savePost: (payload: PostEditorPayload, postId?: string) => Promise<Post>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('blog_token', token);
  } else {
    localStorage.removeItem('blog_token');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('blog_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(token);
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<User>('/auth/me');
        if (isMounted) {
          setUser(response.data);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    void loadUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleAuth(response: AuthResponse) {
    setTokenState(response.access_token);
    setUser(response.user);
    return response.user;
  }

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return handleAuth(response.data);
  }

  async function register(payload: { name: string; username: string; email: string; password: string }) {
    const response = await api.post<AuthResponse>('/auth/register', payload);
    return handleAuth(response.data);
  }

  function logout() {
    setTokenState(null);
    setUser(null);
    setToken(null);
  }

  async function updateUser(payload: Partial<User>) {
    const response = await api.put<User>('/auth/me', payload);
    setUser(response.data);
    return response.data;
  }

  async function fetchMyPosts() {
    const response = await api.get<Post[]>('/users/me/posts');
    return response.data;
  }

  async function fetchBookmarks() {
    const response = await api.get<Post[]>('/users/me/bookmarks');
    return response.data;
  }

  async function fetchLikedPosts() {
    const response = await api.get<Post[]>('/users/me/liked');
    return response.data;
  }

  async function savePost(payload: PostEditorPayload, postId?: string) {
    const response = postId
      ? await api.put<Post>(`/posts/${postId}`, payload)
      : await api.post<Post>('/posts', payload);
    return response.data;
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      fetchMyPosts,
      fetchBookmarks,
      fetchLikedPosts,
      savePost,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
