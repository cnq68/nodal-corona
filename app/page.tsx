"use client";

import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import { useState, useEffect } from "react";
import { createNote } from "@/lib/notes";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import SearchModal from "@/components/SearchModal";
import { subscribeToNotes, subscribeToFolders, Note, Folder } from "@/lib/notes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { user, loading } = useAuth();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScopedSearch, setIsScopedSearch] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    // Auto-hide sidebar on mobile on mount
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (user && activeWorkspaceId) {
      const unsubNotes = subscribeToNotes(user.uid, activeWorkspaceId, setNotes);
      const unsubFolders = subscribeToFolders(user.uid, activeWorkspaceId, setFolders);
      return () => { unsubNotes(); unsubFolders(); };
    }
  }, [user, activeWorkspaceId]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNewNote();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsScopedSearch(false);
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsScopedSearch(true);
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [user, activeFolder, activeWorkspaceId]);

  const handleCreateNewNote = async (title: string = "") => {
    if (user && activeWorkspaceId) {
      const docRef = await createNote(user.uid, activeWorkspaceId, activeFolder || "all");
      if (title) {
        const { updateNote } = await import("@/lib/notes");
        await updateNote(docRef.id, { title });
      }
      setActiveNoteId(docRef.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-black rounded-3xl shadow-xl shadow-gray-200/50"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <main className="flex h-screen bg-white relative overflow-hidden font-sans text-gray-900 selection:bg-gray-100">
      {/* 2-Column Split */}
      
      {/* Column 1: Unified Sidebar (Folders + Notes List) */}
      <Sidebar 
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        activeNoteId={activeNoteId}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isEditorFocused={isEditorFocused}
      />

      {/* Column 2: Editor Content */}
      <div className="flex-1 bg-white relative flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeNoteId ? (
            <motion.div 
              key={activeNoteId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto"
            >
              <Editor noteId={activeNoteId} onFocusChange={setIsEditorFocused} />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-200 p-8 text-center bg-gray-50/10"
            >
               <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 flex items-center justify-center mb-8 border border-gray-50 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-5" />
                  <svg className="w-14 h-14 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
               </div>
               <h2 className="text-2xl font-black text-black tracking-tight">Your Knowledge Awaits</h2>
               <p className="text-sm text-gray-400 mt-3 max-w-[280px] leading-relaxed">
                 Select a thought from the left or <span className="text-black font-bold cursor-pointer hover:underline" onClick={() => handleCreateNewNote()}>capture a new one</span> to begin.
               </p>
               
               <div className="mt-12 flex gap-4">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 shadow-sm">⌘ N</kbd>
                  <kbd className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 shadow-sm">⌘ K</kbd>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop for Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/5 backdrop-blur-[2px] z-30"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Toggle for Sidebar */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed bottom-8 left-8 z-50 p-4 bg-black text-white rounded-3xl shadow-2xl active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}
      {/* Global Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => { setIsSearchOpen(false); setIsScopedSearch(false); }}
        notes={notes}
        folders={folders}
        onSelectNote={setActiveNoteId}
        onSelectFolder={setActiveFolder}
        onCreateNote={handleCreateNewNote}
        scopeFolderId={isScopedSearch ? activeFolder : undefined}
      />
    </main>
  );
}
