"use client";

import React, { useState, useEffect } from "react";
import { 
  Folder, 
  Archive, 
  Trash2, 
  Plus, 
  Hash, 
  ChevronRight, 
  ChevronDown,
  LogOut,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavigationPaneProps {
  activeFolder: string;
  setActiveFolder: (f: string) => void;
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
}

export default function NavigationPane({
  activeFolder,
  setActiveFolder,
  activeTag,
  setActiveTag,
}: NavigationPaneProps) {
  const { user, logout } = useAuth();
  const [customFolders, setCustomFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "folders"), where("userId", "==", user.uid), orderBy("name", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setCustomFolders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      
      // Get unique tags from notes (simplification: fetch from a dedicated tags collection or derive)
      // For now, let's assume a tags collection for performance
      const tq = query(collection(db, "tags"), where("userId", "==", user.uid), orderBy("name", "asc"));
      const unsubTags = onSnapshot(tq, (snapshot) => {
        setTags(snapshot.docs.map(d => d.data().name));
      });

      return () => { unsub(); unsubTags(); };
    }
  }, [user]);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() && user) {
      await addDoc(collection(db, "folders"), {
        name: newFolderName.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        parentId: null // Hierarchical support placeholder
      });
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const menuItems = [
    { id: "all", name: "All Notes", icon: Folder },
    { id: "archive", name: "Archive", icon: Archive },
    { id: "trash", name: "Trash", icon: Trash2 },
  ];

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50/50 dark:bg-[#0d0d0d] transition-colors">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-lg" />
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Nodal</span>
        </div>
        <button onClick={logout} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Main Categories */}
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveFolder(item.id); setActiveTag(null); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                activeFolder === item.id 
                  ? "bg-white dark:bg-neutral-800 shadow-sm text-gray-900 dark:text-white border border-gray-100 dark:border-neutral-700" 
                  : "text-gray-500 dark:text-neutral-400 hover:bg-gray-200/50 dark:hover:bg-neutral-800/50"
              )}
            >
              <item.icon className={cn("w-3.5 h-3.5", activeFolder === item.id ? "text-blue-500" : "text-gray-400 dark:text-neutral-500")} />
              {item.name}
            </button>
          ))}
        </div>

        {/* Folders */}
        <div>
          <button 
            onClick={() => setIsFoldersOpen(!isFoldersOpen)}
            className="w-full flex items-center justify-between px-2 mb-2 group"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace</span>
            <ChevronDown className={cn("w-3 h-3 text-gray-300 transition-transform", !isFoldersOpen && "-rotate-90")} />
          </button>
          
          {isFoldersOpen && (
            <div className="space-y-0.5">
              {customFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setActiveFolder(f.name); setActiveTag(null); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                    activeFolder === f.name ? "bg-white shadow-sm text-gray-900 border border-gray-100" : "text-gray-500 hover:bg-gray-200/50"
                  )}
                >
                  <Folder className={cn("w-3.5 h-3.5", activeFolder === f.name ? "text-blue-500" : "text-gray-400")} />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
              
              {isAddingFolder ? (
                <form onSubmit={handleAddFolder} className="px-3 mt-2">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={() => !newFolderName && setIsAddingFolder(false)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Folder name..."
                  />
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingFolder(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Folder
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5 px-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setActiveFolder(""); }}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                  activeTag === tag ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                )}
              >
                #{tag}
              </button>
            ))}
            {tags.length === 0 && <span className="text-[10px] text-gray-300 italic">No tags yet</span>}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 px-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-[13px] font-medium">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
