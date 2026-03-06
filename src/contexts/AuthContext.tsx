'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import type { User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    name: string;
    role: string;
    organ_id: string | null;
    avatar_url: string | null;
    email?: string;
}

interface AuthContextType {
    currentUser: Profile | null;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, role: string, organId?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<Profile>) => Promise<Profile>;
    hasRole: (allowedRoles?: string[]) => boolean;
    isAuthenticated: boolean;
    initialLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const { t } = useTranslation();
    const supabase = createClient();

    const fetchProfile = async (userId: string, authUser?: User | null) => {
        const { data, error, status } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (status === 406) {
                console.warn('Perfil não encontrado para o usuário:', userId);
                // Use the passed user object or the current state
                const effectiveUser = authUser || user;
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        name: effectiveUser?.email?.split('@')[0] || 'Usuário',
                        role: 'Membro'
                    })
                    .select()
                    .single();

                if (!insertError) {
                    setCurrentUser(newProfile as Profile);
                }
            } else {
                console.error('Erro detalhado ao buscar perfil:', error);
            }
            return;
        }

        if (data) {
            setCurrentUser(data as Profile);
        }
    };

    useEffect(() => {
        const getInitialSession = async () => {
            // Check for required env variables
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                console.error('Supabase keys are missing! Check your Vercel Environment Variables.');
                setInitialLoading(false);
                return;
            }

            // Set a safety timeout of 5 seconds to prevent infinite loading if Supabase is slow/fails
            const timeoutId = setTimeout(() => {
                if (initialLoading) {
                    console.warn('Auth initialization timed out, proceeding with default state.');
                    setInitialLoading(false);
                }
            }, 5000);

            try {
                // Forcing refresh of session to avoid stale data
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Initial session check error:', error);
                }

                const sessionUser = session?.user || null;
                if (sessionUser) {
                    setUser(sessionUser);
                    await fetchProfile(sessionUser.id, sessionUser);
                }
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                clearTimeout(timeoutId);
                setInitialLoading(false);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state change event:', event);
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id, session.user);
                } else {
                    setUser(null);
                    setCurrentUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(t('auth.invalidCredentials') || 'Credenciais inválidas');
        }
        if (data?.user) {
            setUser(data.user);
            await fetchProfile(data.user.id, data.user);
        }
    };

    const signup = async (email: string, password: string, name: string, role: string, organId?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role, organ_id: organId || '' },
            },
        });

        if (error) {
            throw new Error(t('auth.signupFailed') || 'Falha no cadastro');
        }

        if (data?.user) {
            setUser(data.user);
            await fetchProfile(data.user.id, data.user);
        }
    };

    const logout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Clear all local state
            setCurrentUser(null);
            setUser(null);

            // Clear browser cache and storage
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();

                // Clear all cookies
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }

                // Unregister all service workers to break PWA cache
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                // Use a hard reload to ensure a clean slate
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback for extreme cases
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    };

    const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
        if (!currentUser) throw new Error('Not authenticated');

        const { data: updated, error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) {
            throw new Error(t('profile.updateError') || 'Falha ao atualizar perfil');
        }

        const profile = updated as Profile;
        setCurrentUser(profile);
        return profile;
    };

    const hasRole = (allowedRoles?: string[]) => {
        if (!currentUser) return false;
        if (!allowedRoles || allowedRoles.length === 0) return true;
        return allowedRoles.includes(currentUser.role);
    };

    const value: AuthContextType = {
        currentUser,
        user,
        login,
        signup,
        logout,
        updateProfile,
        hasRole,
        isAuthenticated: !!user,
        initialLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
