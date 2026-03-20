"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, FileText, Folder as FolderIcon, X, Calendar, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Note, Folder } from "@/lib/notes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  onSelectNote: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onCreateNote: (title: string) => void;
  scopeFolderId?: string | null;
}

export default function SearchModal({
  isOpen,
  onClose,
  notes,
  folders,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  scopeFolderId
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Simple fuzzy-ish search with Tag support and Scoped Search
  const filteredNotes = notes.filter(n => {
    // Apply scope filter if active
    if (scopeFolderId && scopeFolderId !== "all") {
      if (n.folderId !== scopeFolderId) return false;
    }

    const lowerQuery = query.toLowerCase();
    if (lowerQuery.startsWith("tag:") || lowerQuery.startsWith("#")) {
      const tag = lowerQuery.startsWith("tag:") ? lowerQuery.slice(4) : lowerQuery.slice(1);
      return (n.tags || []).some(t => t.toLowerCase().includes(tag.toLowerCase()));
    }
    return (n.title || "").toLowerCase().includes(lowerQuery) || 
           (n.content || "").toLowerCase().includes(lowerQuery) ||
           (n.ocrText || "").toLowerCase().includes(lowerQuery) ||
           (n.transcript || "").toLowerCase().includes(lowerQuery);
  }).sort((a,b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)).slice(0, 5);

  const filteredFolders = query.startsWith("tag:") || query.startsWith("#") 
    ? [] 
    : folders.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

  const totalResults = filteredNotes.length + filteredFolders.length;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => (prev + 1) % (totalResults || 1));
    }
    if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev - 1 + (totalResults || 1)) % (totalResults || 1));
    }
    if (e.key === "Enter") {
      if (totalResults === 0 && query.trim()) {
        onCreateNote(query);
        onClose();
      } else {
        if (selectedIndex < filteredNotes.length) {
          onSelectNote(filteredNotes[selectedIndex].id);
        } else {
          onSelectFolder(filteredFolders[selectedIndex - filteredNotes.length].id);
        }
        onClose();
      }
    }
  }, [onClose, filteredNotes, filteredFolders, selectedIndex, totalResults, query, onSelectNote, onSelectFolder, onCreateNote]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setSelectedIndex(0);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/5 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white border border-gray-100 rounded-3xl shadow-2xl z-[110] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50 bg-gray-50/10">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            {scopeFolderId && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                <FolderIcon className="w-2.5 h-2.5" />
                {folders.find(f => f.id === scopeFolderId)?.name || scopeFolderId}
              </div>
            )}
          </div>
          <input 
            autoFocus
            type="text"
            placeholder={scopeFolderId ? "Search in this folder..." : "Search notes, folders, or type to create..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-gray-200 text-black font-medium"
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
             ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3">
          {totalResults === 0 && query.trim() ? (
            <button 
              onClick={() => { onCreateNote(query); onClose(); }}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-black group-hover:underline">Create "{query}"</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Quick Note Creation</p>
              </div>
            </button>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center">
               <Search className="w-8 h-8 text-gray-100 mx-auto mb-4" />
               <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Nothing found yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.length > 0 && (
                <div>
                   <h3 className="px-4 py-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Recent Thoughts</h3>
                   {filteredNotes.map((note, idx) => (
                     <button
                       key={note.id}
                       onClick={() => { onSelectNote(note.id); onClose(); }}
                       className={cn(
                         "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                         selectedIndex === idx ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"
                       )}
                     >
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors shadow-sm">
                           {note.isPinned ? <Star className="w-5 h-5 fill-amber-500 text-amber-500" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                           <p className="text-sm font-bold text-black truncate">{note.title || "Untitled Note"}</p>
                           <p className="text-[10px] text-gray-400 truncate mt-0.5">{note.content?.replace(/<[^>]*>?/gm, '') || "No content"}</p>
                        </div>
                        {selectedIndex === idx && <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ENTER</div>}
                     </button>
                   ))}
                </div>
              )}

              {filteredFolders.length > 0 && (
                <div>
                   <h3 className="px-4 py-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Workspaces</h3>
                   {filteredFolders.map((folder, idx) => {
                     const realIdx = idx + filteredNotes.length;
                     return (
                      <button
                        key={folder.id}
                        onClick={() => { onSelectFolder(folder.id); onClose(); }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                          selectedIndex === realIdx ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"
                        )}
                      >
                         <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors shadow-sm">
                            <FolderIcon className="w-5 h-5" />
                         </div>
                         <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{folder.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Directory</p>
                         </div>
                      </button>
                     );
                   })}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                 <span className="bg-white px-1.5 py-0.5 rounded border border-gray-100">↑↓</span> to navigate
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                 <span className="bg-white px-1.5 py-0.5 rounded border border-gray-100">ENTER</span> to open
              </div>
           </div>
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Minimalist Royale v2.0</p>
        </div>
      </motion.div>
    </div>
  );
}
