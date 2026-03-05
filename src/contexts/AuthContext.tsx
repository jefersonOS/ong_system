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

    useEffect(() => {
        const getInitialSession = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    setUser(authUser);
                    await fetchProfile(authUser.id);
                }
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setCurrentUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error, status } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // Se o erro for 406, significa que o registro não existe na tabela profiles
            if (status === 406) {
                console.warn('Perfil não encontrado para o usuário:', userId);
                // Opcional: Criar perfil básico se não existir
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({ id: userId, name: user?.email?.split('@')[0] || 'Usuário', role: 'Membro' })
                    .select()
                    .single();

                if (!insertError) {
                    setCurrentUser(newProfile as Profile);
                }
            } else {
                console.error('Erro detalhado ao buscar perfil:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
            }
            return;
        }

        if (data) {
            setCurrentUser(data as Profile);
        }
    };

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(t('auth.invalidCredentials') || 'Credenciais inválidas');
        }
        if (data?.user) {
            setUser(data.user);
            await fetchProfile(data.user.id);
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
            await fetchProfile(data.user.id);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUser(null);
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
