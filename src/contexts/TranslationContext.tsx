'use client';

import React, { createContext, useState, type ReactNode } from 'react';
import ptBR from '@/i18n/pt-BR.json';

type TranslationDict = Record<string, unknown>;
const translations: Record<string, TranslationDict> = { 'pt-BR': ptBR as TranslationDict };

interface TranslationContextType {
    t: (key: string) => string;
    locale: string;
    setLocale: (locale: string) => void;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
    const [locale, setLocale] = useState('pt-BR');

    const t = (key: string): string => {
        if (!key) return '';
        const keys = key.split('.');
        let value: unknown = translations[locale];
        for (const k of keys) {
            if (value === undefined || value === null) return key;
            value = (value as Record<string, unknown>)[k];
        }
        return (typeof value === 'string' ? value : key);
    };

    return (
        <TranslationContext.Provider value={{ t, locale, setLocale }}>
            {children}
        </TranslationContext.Provider>
    );
};
