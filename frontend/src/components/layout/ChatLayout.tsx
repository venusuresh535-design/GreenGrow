import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LanguageSelectorModal } from '../language/LanguageSelectorModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Conversation } from '../../types';

interface ChatLayoutProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenGuideModal?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  onOpenLanguageModal?: () => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenGuideModal,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onOpenLanguageModal,
}) => {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const effectiveSidebarOpen = isSidebarOpen !== undefined ? isSidebarOpen : internalSidebarOpen;
  const handleToggleSidebar = onToggleSidebar || (() => setInternalSidebarOpen((prev) => !prev));
  const handleCloseSidebar = onCloseSidebar || (() => setInternalSidebarOpen(false));
  const handleOpenLanguage = onOpenLanguageModal || (() => setIsLanguageModalOpen(true));

  const confirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8faf8]">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={effectiveSidebarOpen}
        onClose={handleCloseSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onDeleteConversation={(id) => setConversationToDelete(id)}
        onOpenGuideModal={onOpenGuideModal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          isSidebarOpen={effectiveSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={onNewChat}
          onOpenLanguageModal={handleOpenLanguage}
          onOpenGuideModal={onOpenGuideModal}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* Global Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(conversationToDelete)}
        title="Delete Conversation"
        message="Are you sure you want to delete this farming conversation? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setConversationToDelete(null)}
      />
    </div>
  );
};
