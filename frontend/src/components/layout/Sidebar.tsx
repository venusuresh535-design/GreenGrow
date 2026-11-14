import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  X,
  Sprout,
  LogIn,
  LogOut,
  Info,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenGuideModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenGuideModal,
}) => {
  const { user, isGuest, signOut } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}

      {/* Drawer Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out h-full ${
          isOpen
            ? 'w-72 md:w-80 translate-x-0 opacity-100 shadow-xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:border-r-0 md:overflow-hidden pointer-events-none md:pointer-events-none'
        }`}
      >
        <div className="w-72 md:w-80 flex flex-col h-full flex-shrink-0">
          {/* Top Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-base">
                  Green<span className="text-forest-700">Grow</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Chat History</p>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Close sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-2xl font-bold text-sm shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Previous Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
              <p className="text-xs font-medium">No saved conversations yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your farming chats will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition text-sm ${
                    isActive
                      ? 'bg-forest-50 text-forest-900 font-semibold border border-forest-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-forest-700' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area with Settings and Auth */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1">
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={() => {
                onOpenGuideModal();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-forest-700" />
              <span>User Guide &amp; App Tour</span>
            </button>
          )}

          <Link
            to="/settings"
            onClick={() => {
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-white rounded-xl text-xs font-semibold transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings &amp; Region</span>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out ({user.email?.split('@')[0]})</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-forest-700 hover:bg-forest-50 rounded-xl text-xs font-semibold transition"
            >
              <LogIn className="w-4 h-4" />
              <span>{isGuest ? 'Log In / Register' : 'Sign In'}</span>
            </Link>
          )}

          {/* Gemini AI Powered Badge */}
          <div className="pt-2 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" /> Powered by Gemini
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
        </div>
      </aside>
    </>
  );
};
