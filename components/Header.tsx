import React from 'react';
import { Sparkles, Plus, BookOpen, DollarSign, Clapperboard, Flame, Trophy, Send, Smartphone } from './icons/LucideIcons';
import { UserBrandSettings, UserGamification } from '../types';

interface HeaderProps {
  onCreate: () => void;
  onFeed?: () => void;
  onQuoteVault?: () => void;
  onJournal?: () => void;
  onSeries?: () => void;
  onOpenMonetize?: () => void;
  onOpenBraggingCard?: () => void;
  onOpenAutoPost?: () => void;
  onOpenKglStudio?: () => void;
  brandSettings?: UserBrandSettings;
  gamification?: UserGamification;
  currentView?: 'feed' | 'create' | 'vault' | 'series' | 'journal' | string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onCreate, 
  onFeed, 
 onQuoteVault, onJournal,
  onSeries,
  onOpenMonetize,
  onOpenBraggingCard,
  onOpenAutoPost,
  onOpenKglStudio,
  brandSettings,
  gamification,
  currentView = 'feed' 
}) => {
  return (
    <header className="print:hidden bg-gray-900/90 backdrop-blur-md border-b border-gray-700/80 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Tagline */}
          <div 
            onClick={onFeed}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                  Inspire Engine
                </h1>
                {gamification && (
                  <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                    <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                    {gamification.streakDays}d
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">Manifest • Gamify • Distribute</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            <button
              onClick={onFeed}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'feed'
                  ? 'bg-gray-800 text-white border border-gray-600 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Feed
            </button>

            {onSeries && (
              <button
                onClick={onSeries}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentView === 'series'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500 shadow'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Series & Manifest</span>
              </button>
            )}

            <button
              onClick={onQuoteVault}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'vault'
                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vault</span>
            </button>

            {onJournal && (
              <button
                onClick={onJournal}
                aria-label="Journal"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentView === 'journal'
                    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span aria-hidden="true">📓</span>
                <span className="hidden sm:inline">Journal</span>
              </button>
            )}

            {onOpenBraggingCard && (
              <button
                onClick={onOpenBraggingCard}
                title="Bragging Rights Flex Card"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 transition"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Flex</span>
              </button>
            )}

            {onOpenAutoPost && (
              <button
                onClick={onOpenAutoPost}
                title="Automated Social Post Scheduler"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-950/40 border border-teal-800/60 hover:bg-teal-900/40 transition"
              >
                <Send className="w-3.5 h-3.5 text-teal-400" />
                <span>Auto-Post</span>
              </button>
            )}

            {onOpenKglStudio && (
              <button
                onClick={onOpenKglStudio}
                title="KGL Bespoke Phone Cases & Claude Spec"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-600/60 hover:bg-amber-900/60 transition shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>KGL Studio</span>
              </button>
            )}

            {onOpenMonetize && (
              <button
                type="button"
                onClick={onOpenMonetize}
                title="Monetization Strategy & Pro Brand Kit"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 transition shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{brandSettings?.isPro ? 'Pro' : 'Monetize'}</span>
              </button>
            )}

            <button 
              onClick={onCreate}
              className={`flex items-center gap-1 font-extrabold py-1.5 px-3 rounded-xl text-xs transition-all shadow-md ${
                currentView === 'create'
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};