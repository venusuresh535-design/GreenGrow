import React from 'react';
import { Menu, Plus, Globe2, Sprout, User as UserIcon, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenLanguageModal: () => void;
  onOpenGuideModal?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenLanguageModal,
  onOpenGuideModal,
  isSidebarOpen = false,
}) => {
  const { selectedLanguage } = usePreferences();
  const { user, isGuest } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar (Chat History & Menu)'}
          className={`p-2 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer ${
            isSidebarOpen
              ? 'text-forest-800 bg-forest-50 hover:bg-forest-100/80 border border-forest-200/60'
              : 'text-slate-600 hover:text-forest-800 hover:bg-forest-50 border border-transparent'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-forest-700 group-hover:bg-forest-800 text-white flex items-center justify-center shadow-xs transition">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none block">
              Green<span className="text-forest-700">Grow</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              AI Farming Assistant
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Selector Pill */}
        <button
          type="button"
          onClick={onOpenLanguageModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-50 hover:bg-forest-100/80 text-forest-800 border border-forest-200/80 rounded-xl text-xs md:text-sm font-semibold transition active:scale-95"
          title="Change response language"
        >
          <Globe2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
          <span className="hidden sm:inline text-forest-700">Language:</span>
          <span className="font-bold underline decoration-forest-400">
            {selectedLanguage.name} ({selectedLanguage.nativeName})
          </span>
        </button>

        {/* User Guide Pill */}
        {onOpenGuideModal && (
          <button
            type="button"
            onClick={onOpenGuideModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-forest-800 hover:bg-forest-50 border border-slate-200/90 rounded-xl text-xs md:text-sm font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
            title="First-time user guide & how to use GreenGrow"
          >
            <HelpCircle className="w-4 h-4 text-forest-700" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs md:text-sm font-semibold shadow-2xs transition active:scale-95"
          title="Start a new conversation"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* User / Settings Profile Pill */}
        <Link
          to="/settings"
          className="p-2 text-slate-600 hover:text-forest-800 hover:bg-slate-100 rounded-xl transition"
          title={user ? `Signed in as ${user.email}` : isGuest ? 'Guest Farmer (Settings)' : 'Settings'}
        >
          <div className="relative">
            <UserIcon className="w-5 h-5" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                user ? 'bg-forest-600' : 'bg-amber-500'
              }`}
            />
          </div>
        </Link>
      </div>
    </header>
  );
};
