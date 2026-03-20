"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, ListFilter, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToNotes, createNote, Note } from "@/lib/notes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NoteListPaneProps {
  activeWorkspaceId: string;
  activeFolder: string;
  activeTag: string | null;
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export default function NoteListPane({
  activeWorkspaceId,
  activeFolder,
  activeTag,
  activeNoteId,
  onSelectNote,
}: NoteListPaneProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && activeWorkspaceId) {
      const unsub = subscribeToNotes(user.uid, activeWorkspaceId, setNotes);
      return () => unsub();
    }
  }, [user, activeWorkspaceId]);

  const filteredNotes = notes.filter(note => {
    // Folder filter
    let matchesFolder = true;
    if (activeFolder) {
      const isSpecial = ["all", "archive", "trash"].includes(activeFolder);
      if (isSpecial) {
        if (activeFolder === "archive") matchesFolder = note.folderId === "archive";
        else if (activeFolder === "trash") matchesFolder = note.folderId === "trash";
        else matchesFolder = note.folderId !== "trash" && note.folderId !== "archive";
      } else {
        matchesFolder = note.folderId === activeFolder;
      }
    }
    
    // Tag filter
    const matchesTag = !activeTag || (note.tags && note.tags.includes(activeTag));
    
    // Search filter
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (note.title || "").toLowerCase().includes(lowerQuery) || 
      (note.content || "").toLowerCase().includes(lowerQuery) ||
      (note.tags || []).some(t => t.toLowerCase().includes(lowerQuery));

    return matchesFolder && matchesTag && matchesSearch;
  });

  const handleCreateNote = async () => {
    if (user) {
      const docRef = await createNote(user.uid, activeFolder || "all");
      onSelectNote(docRef.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#121212] transition-colors">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight capitalize">
            {activeTag ? `#${activeTag}` : (activeFolder === "all" ? "All Notes" : activeFolder)}
          </h2>
          <button 
            onClick={handleCreateNote}
            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-neutral-600" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-800/50 border-none rounded-xl text-sm placeholder:text-gray-300 dark:placeholder:text-neutral-600 dark:text-white focus:ring-1 focus:ring-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-8 divide-y divide-gray-50/50 dark:divide-neutral-800/50">
        {filteredNotes.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-gray-300 dark:text-neutral-700 text-xs italic gap-2">
             <ListFilter className="w-4 h-4 text-gray-200 dark:text-neutral-800" />
             No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all group relative my-0.5",
                activeNoteId === note.id 
                  ? "bg-white dark:bg-neutral-800 shadow-md border border-gray-100 dark:border-neutral-700" 
                  : "hover:bg-gray-50/50 dark:hover:bg-neutral-800/30"
              )}
            >
              {activeNoteId === note.id && (
                <div className="absolute left-1 top-4 bottom-4 w-1 bg-blue-500 rounded-full" />
              )}
              <h3 className={cn(
                "text-sm font-bold truncate mb-1",
                activeNoteId === note.id ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-neutral-300"
              )}>
                {note.title || "Untitled Note"}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-neutral-500 line-clamp-2 leading-relaxed mb-3">
                {note.content?.replace(/<[^>]*>?/gm, '') || "No additional text"}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 overflow-hidden">
                  {(note.tags || []).slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 px-1.5 py-0.5 rounded-md border border-transparent dark:border-neutral-700">#{t}</span>
                  ))}
                </div>
                <span className="text-[10px] text-gray-300 dark:text-neutral-600 font-medium">
                  {note.updatedAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
