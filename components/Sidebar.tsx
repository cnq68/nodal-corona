"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Folder as FolderIcon, 
  Archive, 
  Trash2, 
  Search,
  LogOut,
  Hash,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FolderOpen,
  Star,
  Tag,
  Edit2,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToNotes,
  subscribeToFolders,
  subscribeToWorkspaces,
  createNote,
  updateNote,
  deleteNote,
  createFolder,   createWorkspace,
   deleteWorkspace,
   deleteFolder,
   subscribeToTags,
  renameTag,
  deleteTag,
  Note,
  Folder,
  Workspace
} from "@/lib/notes";
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  onSelectNote: (id: string) => void;
  activeNoteId: string | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  isEditorFocused?: boolean;
}

export default function Sidebar({
  activeFolder,
  setActiveFolder,
  onSelectNote,
  activeNoteId,
  activeWorkspaceId,
  setActiveWorkspaceId,
  isOpen = true,
  onToggle,
  isEditorFocused = false
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Note: we use props for activeFolder and onSelectNote

  useEffect(() => {
    if (user) {
      const unsubscribeWorkspaces = subscribeToWorkspaces(user.uid, (ws) => {
        setWorkspaces(ws);
        if (ws.length === 0) {
          createWorkspace(user.uid, "Personal");
        } else if (!activeWorkspaceId) {
          setActiveWorkspaceId(ws[0].id);
        }
      });
      return () => unsubscribeWorkspaces();
    }
  }, [user, activeWorkspaceId]);

  useEffect(() => {
    if (user && activeWorkspaceId) {
      const unsubscribeNotes = subscribeToNotes(user.uid, activeWorkspaceId, setNotes);
      const unsubscribeFolders = subscribeToFolders(user.uid, activeWorkspaceId, setFolders);
      return () => {
        unsubscribeNotes();
        unsubscribeFolders();
      };
    }
  }, [user, activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      const unsubscribe = subscribeToTags(activeWorkspaceId, (fetchedTags) => {
        setTags(fetchedTags);
      });
      return unsubscribe;
    }
  }, [activeWorkspaceId]);

  const handleRenameTag = async (oldTag: string) => {
    if (newTagName.trim() && activeWorkspaceId) {
      await renameTag(activeWorkspaceId, oldTag, newTagName.trim());
      setEditingTag(null);
      setNewTagName("");
    }
  };

  const handleDeleteTag = async (tag: string) => {
    if (activeWorkspaceId && window.confirm(`Delete tag #${tag} everywhere?`)) {
      await deleteTag(activeWorkspaceId, tag);
    }
  };
  
  const handleDeleteFolder = async (folder: Folder) => {
    const hasChildren = folders.some(f => f.parentId === folder.id) || notes.some(n => n.folderId === folder.id);
    const msg = hasChildren 
      ? `Folder "${folder.name}" contains notes or subfolders. Moving everything to trash?` 
      : `Delete folder "${folder.name}"?`;
      
    if (window.confirm(msg)) {
      // Move notes to trash
      const batch = notes.filter(n => n.folderId === folder.id);
      for (const note of batch) {
        await updateNote(note.id, { folderId: "trash" });
      }
      // Delete the folder
      await deleteFolder(folder.id);
      if (activeFolder === folder.id) setActiveFolder("all");
    }
  };

  const handleDeleteWorkspace = async (ws: Workspace) => {
    const confirmation = window.prompt(`Type "${ws.name}" to confirm deletion of this entire workspace:`);
    if (confirmation === ws.name) {
      await deleteWorkspace(ws.id);
      if (activeWorkspaceId === ws.id) {
        setActiveWorkspaceId(workspaces.find(w => w.id !== ws.id)?.id || "");
      }
    } else if (confirmation !== null) {
      alert("Name mismatch. Workspace not deleted.");
    }
  };

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const handleAddFolder = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (newFolderName.trim() && user && activeWorkspaceId) {
      await createFolder(user.uid, activeWorkspaceId, newFolderName.trim(), parentId);
      setNewFolderName("");
      setIsAddingFolder(null);
      if (parentId) {
        const next = new Set(expandedFolders);
        next.add(parentId);
        setExpandedFolders(next);
      }
    }
  };

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const defaultFolders = [
    { id: "all", name: "All Notes", icon: FolderIcon },
    { id: "archive", name: "Archive", icon: Archive },
    { id: "trash", name: "Trash", icon: Trash2 },
  ];

  const starredNotes = notes.filter(n => n.isPinned && n.folderId !== "trash" && n.folderId !== "archive");
  
  const filteredNotes = notes.filter(note => {
    const isSpecialFolder = ["all", "archive", "trash"].includes(activeFolder.toLowerCase());
    
    // Support tag: prefix in search
    const lowerQuery = searchQuery.toLowerCase();
    if (lowerQuery.startsWith("tag:")) {
      const tag = lowerQuery.slice(4);
      return note.tags?.includes(tag) && note.folderId !== "trash" && note.folderId !== "archive";
    }

    // If activeFolder is a tag (starts with #) - legacy support
    if (activeFolder.startsWith("#")) {
      const tag = activeFolder.slice(1);
      return note.tags?.includes(tag) && note.folderId !== "trash" && note.folderId !== "archive";
    }

    const matchesFolder = isSpecialFolder 
      ? (activeFolder === "archive" ? note.folderId === "archive" : (activeFolder === "trash" ? note.folderId === "trash" : note.folderId !== "trash" && note.folderId !== "archive"))
      : note.folderId === activeFolder;
      
    const titleMatch = (note.title || "").toLowerCase().includes(lowerQuery);
    const contentMatch = (note.content || "").toLowerCase().includes(lowerQuery);
    
    return matchesFolder && (titleMatch || contentMatch);
  });

  const handleAddNewNote = async () => {
    if (user && activeWorkspaceId) {
      const folderId = ["archive", "trash"].includes(activeFolder) ? "all" : activeFolder;
      const docRef = await createNote(user.uid, activeWorkspaceId, folderId);
      onSelectNote(docRef.id);
    }
  };

  const [menuOpenNoteId, setMenuOpenNoteId] = useState<string | null>(null);

interface FolderItemProps {
  key?: any;
  folder: Folder;
  level?: number;
  activeFolder: string;
  folders: Folder[];
  expandedFolders: Set<string>;
  setActiveFolder: (id: string) => void;
  toggleFolder: (id: string) => void;
  setIsAddingFolder: (id: string | null) => void;
  isAddingFolder: string | null;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleAddFolder: (e: React.FormEvent, parentId: string | null) => void;
  onDeleteFolder: (folder: Folder) => void;
}

const FolderItem = ({ 
  folder, 
  level = 0,
  activeFolder,
  folders,
  expandedFolders,
  setActiveFolder,
  toggleFolder,
  setIsAddingFolder,
  isAddingFolder,
  newFolderName,
  setNewFolderName,
  handleAddFolder,
  onDeleteFolder
}: FolderItemProps) => {
  const isExpanded = expandedFolders.has(folder.id);
  const childFolders = folders.filter(f => f.parentId === folder.id);
  const isActive = activeFolder === folder.id;

  return (
    <div className="space-y-1">
      <div 
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        className={cn(
          "group flex items-center justify-between py-1.5 pr-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
          isActive ? "tab-active" : "text-gray-500 hover:bg-gray-50"
        )}
        onClick={() => setActiveFolder(folder.id)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            {childFolders.length > 0 ? (
              isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
            ) : (
              <div className="w-3" />
            )}
          </button>
          <FolderIcon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-black" : "text-gray-400 group-hover:text-gray-600")} />
          <span className="truncate">{folder.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingFolder(folder.id);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder);
            }}
            className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden"
          >
            {childFolders.map(child => (
              <FolderItem 
                key={child.id} 
                folder={child} 
                level={level + 1}
                activeFolder={activeFolder}
                folders={folders}
                expandedFolders={expandedFolders}
                setActiveFolder={setActiveFolder}
                toggleFolder={toggleFolder}
                setIsAddingFolder={setIsAddingFolder}
                isAddingFolder={isAddingFolder}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                handleAddFolder={handleAddFolder}
                onDeleteFolder={onDeleteFolder}
              />
            ))}
            {isAddingFolder === folder.id && (
              <form 
                onSubmit={(e) => handleAddFolder(e, folder.id)} 
                className="mt-1"
                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
              >
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsAddingFolder(null)}
                  placeholder="Subfolder..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[12px] focus:ring-2 focus:ring-black/5 outline-none"
                />
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-[320px] sidebar-glass flex flex-col transition-all duration-700 md:relative md:translate-x-0",
      !isOpen && "-translate-x-full",
      isEditorFocused && "opacity-0 blur-md pointer-events-none translate-x-[-20px] md:opacity-20 md:translate-x-0 md:blur-sm"
    )}>
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="relative mb-8">
          <button 
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-3 w-full text-left p-2 -ml-2 rounded-2xl hover:bg-gray-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white font-semibold text-xl shadow-lg shadow-gray-200/50 group-hover:scale-105 transition-transform">
              {currentWorkspace?.name?.[0] || "N"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold text-black truncate">{currentWorkspace?.name || "Select Workspace"}</h1>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Workspace</p>
            </div>
          </button>

          <AnimatePresence>
            {showWorkspaceMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWorkspaceMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 top-full mt-2 w-full glass border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-gray-50">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Switch Workspace</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {workspaces.map(ws => (
                      <div key={ws.id} className="group/ws relative flex items-center pr-2 hover:bg-gray-50 transition-all font-medium">
                        <button
                          onClick={() => {
                            setActiveWorkspaceId(ws.id);
                            setShowWorkspaceMenu(false);
                          }}
                          className={cn(
                            "flex-1 text-left px-4 py-3 text-xs flex items-center justify-between",
                            activeWorkspaceId === ws.id ? "text-black bg-gray-50/50" : "text-gray-500"
                          )}
                        >
                          {ws.name}
                          {activeWorkspaceId === ws.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws); }}
                          className="opacity-0 group-hover/ws:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={async () => {
                      const name = window.prompt("Workspace name:");
                      if (name && user) {
                        const res = await createWorkspace(user.uid, name);
                        setActiveWorkspaceId(res.id);
                        setShowWorkspaceMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-xs text-black font-bold hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Workspace
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Create Note Button */}
        <button 
          onClick={handleAddNewNote}
          className="w-full btn-primary flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-8">
        {/* Special Folders */}
        <div className="space-y-1">
          {defaultFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group",
                activeFolder === f.id ? "tab-active" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <f.icon className={cn("w-4 h-4", activeFolder === f.id ? "text-black" : "text-gray-400 group-hover:text-gray-600")} />
                {f.name}
              </div>
              {activeFolder === f.id && <ChevronRight className="w-3 h-3 text-black/40" />}
            </button>
          ))}
        </div>

        {/* Starred Notes */}
        {starredNotes.length > 0 && (
          <div>
            <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Starred
            </h3>
            <div className="space-y-2">
              {starredNotes.slice(0, 3).map(note => (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white transition-all border border-transparent hover:border-gray-50"
                >
                  <p className="text-[12px] font-bold text-gray-700 truncate">{note.title || "Untitled"}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Folders Tree */}
        <div>
          <div className="flex items-center justify-between px-2 mb-3">
             <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Workspace</h3>
             <button 
                onClick={() => setIsAddingFolder("root")}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-all"
             >
                <Plus className="w-3 h-3 text-gray-400" />
             </button>
          </div>
          <div className="space-y-1">
            {folders.filter(f => !f.parentId).map(folder => (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                activeFolder={activeFolder}
                folders={folders}
                expandedFolders={expandedFolders}
                setActiveFolder={setActiveFolder}
                toggleFolder={toggleFolder}
                setIsAddingFolder={setIsAddingFolder}
                isAddingFolder={isAddingFolder}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                handleAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            ))}
            
            {isAddingFolder === "root" && (
              <form onSubmit={(e) => handleAddFolder(e, null)} className="px-3 mt-1">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsAddingFolder(null)}
                  placeholder="Root folder..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[12px] focus:ring-2 focus:ring-black/5 outline-none"
                />
              </form>
            )}
          </div>
        </div>

        {/* Tag Explorer */}
        {tags.length > 0 && (
          <div>
            <div className="px-2 mb-3 flex items-center justify-between">
               <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Tag Explorer</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {tags.map(tag => (
                <div key={tag} className="group relative">
                  {editingTag === tag ? (
                    <input
                      autoFocus
                      className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-black outline-none w-20"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onBlur={() => setEditingTag(null)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameTag(tag)}
                    />
                  ) : (
                    <button
                      onClick={() => setSearchQuery(`tag:${tag}`)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 group/tag",
                        searchQuery === `tag:${tag}` ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:text-black"
                      )}
                    >
                      <span>#</span>
                      {tag}
                      <div className="flex items-center gap-1 opacity-0 group-hover/tag:opacity-100 transition-opacity ml-1 border-l border-gray-300 pl-1">
                        <Edit2 className="w-2 h-2 cursor-pointer hover:text-blue-500" onClick={(e) => { e.stopPropagation(); setEditingTag(tag); setNewTagName(tag); }} />
                        <X className="w-2 h-2 cursor-pointer hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag); }} />
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes List */}
        <div>
          <h3 className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {activeFolder.startsWith("#") ? `Tag: ${activeFolder.slice(1)}` : (activeFolder === "all" ? "Latest Notes" : (folders.find(f => f.id === activeFolder)?.name || activeFolder))}
          </h3>
          <div className="space-y-2 pb-10">
            <AnimatePresence mode="popLayout">
              {filteredNotes.length === 0 ? (
                <div className="px-4 py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                  <p className="text-[11px] text-gray-400 italic serif">No entries found</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative"
                  >
                    <button
                      onClick={() => onSelectNote(note.id)}
                      className={cn(
                        "w-full text-left note-card relative group",
                        activeNoteId === note.id ? "bg-white shadow-md border-gray-100" : "bg-transparent border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("text-sm font-semibold truncate pr-6", activeNoteId === note.id ? "text-black" : "text-gray-700")}>
                          {note.title || "Untitled Note"}
                        </h4>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenNoteId(menuOpenNoteId === note.id ? null : note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                          >
                             <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {menuOpenNoteId === note.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpenNoteId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-2 w-48 glass border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                                >
                                  <p className="px-4 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-50">Move to...</p>
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {["all", "archive", "trash", ...folders.map(f => f.id)].map(fId => {
                                      const folderName = fId === "all" ? "All" : (fId === "archive" ? "Archive" : (fId === "trash" ? "Trash" : folders.find(f => f.id === fId)?.name || fId));
                                      return (
                                        <button
                                          key={fId}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await updateNote(note.id, { folderId: fId });
                                            setMenuOpenNoteId(null);
                                          }}
                                          className={cn(
                                            "w-full text-left px-4 py-2 text-[11px] hover:bg-gray-50 transition-colors bg-transparent font-bold",
                                            note.folderId === fId ? "text-black bg-gray-50/50" : "text-gray-500"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <FolderOpen className="w-3 h-3" />
                                            {folderName}
                                          </div>
                                        </button>
                                      );
                                    })}
                                    {note.folderId === "trash" && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (window.confirm("Delete this thought permanently? This cannot be undone.")) {
                                            await deleteNote(note.id);
                                            setMenuOpenNoteId(null);
                                          }
                                        }}
                                        className="w-full text-left px-4 py-2 text-[11px] hover:bg-red-50 text-red-500 transition-colors bg-transparent font-bold border-t border-gray-50 mt-1"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Trash2 className="w-3 h-3" />
                                          Delete Permanently
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          {note.updatedAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || "New"}
                        </span>
                        <p className="text-[11px] text-gray-400 truncate flex-1 leading-none h-3 overflow-hidden">
                          {note.content?.replace(/<[^>]*>?/gm, '') || "Start writing..."}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer / Status & Logout */}
      <div className="p-4 border-t border-gray-50 bg-white/50">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <p className="text-[10px] text-gray-400 font-medium Serif italic">Cloud Sync Active</p>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-2 py-1 text-gray-400 hover:text-black transition-all hover:bg-gray-50 rounded-lg group"
            title="Logout"
          >
            <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Exit</span>
            <LogOut className="w-4 h-4 transform scale-x-[-1]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
