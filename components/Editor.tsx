"use client";

import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { Node, mergeAttributes } from "@tiptap/core";
import { updateNote, createFolder, subscribeToFolders, Note, Folder } from "@/lib/notes";
import { doc, onSnapshot, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import SlashMenu from "./SlashMenu";
import VoiceBlock from "./VoiceBlock";
import { Calendar, Loader2, FolderOpen, ChevronDown, FileText, Tag as TagIcon, X, Type, Share2, MoreHorizontal, Sparkles, Star, Plus, Bold, Italic, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TagMark = Node.create({
  name: "tag",
  group: "inline",
  inline: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      label: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-tag]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-tag": node.attrs.label, class: "text-black bg-gray-50 px-1.5 py-0.5 rounded-md font-bold" }), `#${node.attrs.label}`];
  },
});

const Iframe = Node.create({
  name: "iframe",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: 0 },
      allowfullscreen: { default: "true" },
    };
  },
  parseHTML() {
    return [{ tag: "iframe" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { class: "video-wrapper aspect-video w-full my-8 rounded-2xl overflow-hidden border border-gray-100 shadow-lg" }, ["iframe", mergeAttributes(HTMLAttributes, { class: "w-full h-full" })]];
  },
});

interface EditorProps {
  noteId: string;
  onFocusChange?: (isFocused: boolean) => void;
}

export default function Editor({ noteId, onFocusChange }: EditorProps) {
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const saveTimeoutRef = useRef<any>(null); // Changed from NodeJS.Timeout to any

  const [newTag, setNewTag] = useState("");
  const [tagMenuPos, setTagMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [tagQuery, setTagQuery] = useState("");
  const [workspaceTags, setWorkspaceTags] = useState<string[]>([]);
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
          return "Type '/' for commands...";
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: 'rounded-2xl max-w-full h-auto border border-gray-100 shadow-sm my-8' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-black underline font-bold cursor-pointer',
        },
      }),
      Iframe,
      TagMark,
    ],
    editorProps: {
      attributes: { class: "notion-editor min-h-[500px] w-full max-w-3xl mx-auto px-4 md:px-0" },
      handleKeyDown: (view, event) => handleEditorKeyDown(view, event as KeyboardEvent),
    },
    onFocus: () => onFocusChange?.(true),
    onBlur: () => onFocusChange?.(false),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateNote(noteId, { content: html });
      }, 1000);
    },
    onSelectionUpdate: ({ editor }) => {
      const { empty } = editor.state.selection;
      if (empty) {
        setSelectionMenuPos(null);
        return;
      }
      const { view } = editor;
      const { from, to } = view.state.selection;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      setSelectionMenuPos({
        top: Math.min(start.top, end.top) - 40,
        left: (start.left + end.left) / 2
      });
    },
  }, [noteId]); // Added noteId to dependency array for editor

  useEffect(() => {
    if (user) {
      const unsubscribeFolders = subscribeToFolders(user.uid, note?.workspaceId || "all", setFolders);
      const unsubscribeNote = onSnapshot(doc(db, "notes", noteId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Note;
          setNote(data);
          // Only update editor content if it's different to prevent cursor jumps
          if (editor && editor.getHTML() !== data.content) {
            editor.commands.setContent(data.content || "");
          }
          if (data.isVoice) setShowVoice(true);
        }
      });
      return () => {
        unsubscribeFolders();
        unsubscribeNote();
      };
    }
  }, [user, noteId, editor]);

  useEffect(() => {
    if (user && note?.workspaceId) {
      const q = query(collection(db, "notes"), where("workspaceId", "==", note.workspaceId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tags = new Set<string>();
        snapshot.docs.forEach(d => {
          const data = d.data() as Note;
          data.tags?.forEach(t => tags.add(t));
        });
        setWorkspaceTags(Array.from(tags).sort());
      });
      return unsubscribe;
    }
  }, [user, note?.workspaceId]);

  const handleMoveNote = async (folderId: string) => {
    await updateNote(noteId, { folderId });
    setShowMoveMenu(false);
  };

  const togglePin = async () => {
    if (note) {
      await updateNote(noteId, { isPinned: !note.isPinned });
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !note?.tags.includes(newTag.trim())) {
      const updatedTags = [...(note?.tags || []), newTag.trim()];
      await updateNote(noteId, { tags: updatedTags });
      
      const tagQuery = query(collection(db, "tags"), where("userId", "==", user?.uid), where("name", "==", newTag.trim()));
      const tagSnap = await getDocs(tagQuery);
      if (tagSnap.empty && user) {
        await addDoc(collection(db, "tags"), { name: newTag.trim(), userId: user.uid });
      }
      
      setNewTag("");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = (note?.tags || []).filter(t => t !== tagToRemove);
    await updateNote(noteId, { tags: updatedTags });
  };

  const handlePdfUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `pdfs/${noteId}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateNote(noteId, { pdfUrl: url });
    } catch (err) {
      console.error("PDF upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditorKeyDown = (view: any, event: KeyboardEvent) => {
    if (event.key === "/") {
      const { selection } = view.state;
      const coords = view.coordsAtPos(selection.from);
      setMenuPosition({ top: coords.bottom, left: coords.left });
    } else if (event.key === "#") {
      const { selection } = view.state;
      const coords = view.coordsAtPos(selection.from);
      setTagMenuPos({ top: coords.bottom, left: coords.left });
      setTagQuery("");
    } else {
      if (tagMenuPos) {
        if (event.key === "Backspace" && tagQuery === "") {
          setTagMenuPos(null);
        } else if (event.key === " " || event.key === "Enter") {
          // If tagQuery is just hashes (one or more), it's likely a header shortcut (# , ## , ### )
          // In this case, we close the menu and let Tiptap handle the input rule.
          const isHeaderShortcut = /^#*$/.test(tagQuery);
          
          if (tagQuery && !isHeaderShortcut) {
            handleSelectTag(tagQuery);
            event.preventDefault();
            return true;
          }
          setTagMenuPos(null);
        }
 else if (event.key.length === 1) {
          setTagQuery(prev => prev + event.key);
        }
      }
      setMenuPosition(null);
    }
    return false;
  };

  const handleSelectTag = async (tag: string) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    editor.commands.deleteRange({ from: from - tagQuery.length - 1, to: from });
    editor.commands.insertContent({
      type: "tag",
      attrs: { label: tag }
    });
    editor.commands.insertContent(" ");
    
    const updatedTags = Array.from(new Set([...(note?.tags || []), tag]));
    await updateNote(noteId, { tags: updatedTags });
    
    setTagMenuPos(null);
    setTagQuery("");
  };

  const handleCommand = async (command: string) => {
    if (!editor) return;
    editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });

    switch (command) {
      case "h1": editor.commands.toggleHeading({ level: 1 }); break;
      case "h2": editor.commands.toggleHeading({ level: 2 }); break;
      case "h3": editor.commands.toggleHeading({ level: 3 }); break;
      case "bullet": editor.commands.toggleBulletList(); break;
      case "todo": editor.commands.toggleTaskList(); break;
      case "voice": setShowVoice(true); break;
      case "code": editor.commands.toggleCodeBlock(); break;
      case "youtube":
        const url = window.prompt(`Enter ${command} URL:`);
        if (url) {
          let embedUrl = url;
          if (command === "youtube") {
            const videoId = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/)?.[1];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
          editor.commands.insertContent({
            type: "iframe",
            attrs: { src: embedUrl }
          });
        }
        break;
      case "image": 
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) handleImageUpload(file);
        };
        input.click();
        break;
    }
    setMenuPosition(null);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `notes/${noteId}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      editor?.commands.setImage({ src: url });

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const { text } = await ocrRes.json();
      
      if (text) {
        const currentOcr = note?.ocrText || "";
        updateNote(noteId, { ocrText: currentOcr + "\n" + text });
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const exportToCalendar = () => {
    const title = note?.title || "Untitled";
    const content = note?.content?.replace(/<[^>]*>?/gm, '') || "";
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${content}\nDTSTART:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}\nDTEND:${new Date(Date.now() + 3600000).toISOString().replace(/-|:|\.\d+/g, '')}\nEND:VEVENT\nEND:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    link.click();
  };

  const [localTitle, setLocalTitle] = useState("");

  useEffect(() => {
    if (note && note.title !== localTitle) {
      setLocalTitle(note.title || "");
    }
  }, [note?.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalTitle(newVal);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(noteId, { title: newVal });
    }, 500);
  };

  if (!note) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="relative pb-32 max-w-4xl mx-auto px-6 pt-12">
      {/* Editor Toolbar */}
       <div className="flex items-center justify-between mb-12 border-b border-gray-50 pb-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-black">
              <FileText className="w-4 h-4" />
           </div>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thought {noteId.slice(-4)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-2 text-gray-400 hover:text-black transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-100 rounded-xl"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {note?.folderId || "Move"}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            <AnimatePresence>
              {showMoveMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/5" 
                    onClick={() => setShowMoveMenu(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 glass border border-gray-100 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden"
                  >
                    <div className="px-5 py-2 mb-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Relocate Thought</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {["all", "archive", "trash", ...folders.map(f => f.id)].map(fId => {
                        const folderName = fId === "all" ? "All" : (fId === "archive" ? "Archive" : (fId === "trash" ? "Trash" : folders.find(f => f.id === fId)?.name || fId));
                        return (
                          <button
                            key={fId}
                            onClick={() => handleMoveNote(fId)}
                            className={cn(
                              "w-full text-left px-5 py-3 text-xs flex items-center justify-between hover:bg-gray-50 transition-all capitalize font-medium group",
                              note?.folderId === fId ? "text-black bg-gray-50/50" : "text-gray-600"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <FolderOpen className={cn("w-3.5 h-3.5", note?.folderId === fId ? "text-black" : "text-gray-400 group-hover:text-black")} />
                              {folderName}
                            </div>
                            {note?.folderId === fId && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={togglePin}
            className={cn(
              "p-2 transition-all bg-white border border-gray-100 rounded-xl shadow-sm",
              note?.isPinned ? "text-amber-500 bg-amber-50/50 border-amber-100" : "text-gray-400 hover:text-amber-500"
            )}
          >
            <Star className={cn("w-4 h-4", note?.isPinned && "fill-amber-500")} />
          </button>

          <button onClick={exportToCalendar} className="p-2 text-gray-400 hover:text-black transition-all bg-white border border-gray-100 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-black transition-all bg-white border border-gray-100 rounded-xl shadow-sm">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showVoice && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-12 overflow-hidden"
          >
            <VoiceBlock noteId={noteId} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-12">
        <input
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-5xl md:text-6xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-black placeholder:text-gray-100 tracking-tight"
        />
        
        <div className="mt-6 flex items-center gap-4">
           {/* PDF Upload Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white text-gray-500 hover:text-black border border-gray-100 rounded-2xl text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95">
             <FileText className="w-4 h-4" />
             Attach Document
             <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) handlePdfUpload(file);
             }} />
          </label>
          
          {isUploading && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-black animate-pulse uppercase tracking-widest">
               <Loader2 className="w-3 h-3 animate-spin" />
               Processing...
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} />
      
      {editor && tagMenuPos && (
        <div 
          className="fixed z-[60] glass border border-gray-100 rounded-2xl shadow-2xl py-2 w-48 overflow-hidden"
          style={{ top: tagMenuPos.top, left: tagMenuPos.left }}
        >
          <div className="px-3 py-1.5 border-b border-gray-50 mb-1">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select or Create Tag</span>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {workspaceTags.filter(t => t.includes(tagQuery)).map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 font-bold text-gray-700 transition-all flex items-center gap-2"
              >
                <TagIcon className="w-3 h-3 text-gray-300" />
                {tag}
              </button>
            ))}
            {tagQuery && !workspaceTags.includes(tagQuery) && (
              <button
                onClick={() => handleSelectTag(tagQuery)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 font-black text-black transition-all flex items-center gap-2 bg-gray-50/50"
              >
                <Plus className="w-3 h-3" />
                Create "{tagQuery}"
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Selection Toolbar (Invisible UI) */}
      <AnimatePresence>
        {editor && selectionMenuPos && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="fixed z-[70] bg-black text-white px-1.5 py-1 rounded-xl shadow-2xl flex items-center gap-0.5"
            style={{ 
              top: selectionMenuPos.top, 
              left: selectionMenuPos.left,
              transform: "translateX(-50%)"
            }}
          >
            <button 
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("p-2 hover:bg-white/10 rounded-lg transition-colors", editor.isActive("bold") && "text-blue-400")}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("p-2 hover:bg-white/10 rounded-lg transition-colors", editor.isActive("italic") && "text-blue-400")}
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button 
              onClick={() => {
                const url = window.prompt("Enter URL:");
                if (url) editor.chain().focus().setLink?.({ href: url }).run();
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-20 space-y-12 border-t border-gray-50 pt-12">
        {note?.pdfUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black">Linked Document</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">PDF Preview</p>
                  </div>
               </div>
               <button onClick={() => updateNote(noteId, { pdfUrl: "" })} className="p-2 text-gray-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                  <X className="w-5 h-5" />
               </button>
            </div>
            <iframe src={note.pdfUrl} className="w-full h-[600px] border border-gray-100 rounded-[2rem] shadow-2xl bg-white" title="PDF Preview" />
          </motion.div>
        )}

        {/* OCR Section */}
        {note?.ocrText && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Sparkles className="w-20 h-20 text-black" />
            </div>
            
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                <Type className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-black">OCR Extraction</h4>
            </div>
            
            <div className="text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed relative mb-8">
              "{note.ocrText}"
            </div>
            
            <button 
              onClick={() => {
                editor?.commands.insertContent(note.ocrText || "");
                updateNote(noteId, { ocrText: "" });
              }}
              className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-gray-900 active:scale-95 transition-all"
            >
              Merge into Thought
            </button>
          </motion.div>
        )}

        {/* Tags */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <TagIcon className="w-4 h-4 text-gray-400" />
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {note?.tags.map(tag => (
              <span key={tag} className="group flex items-center gap-2 px-4 py-1.5 bg-white text-gray-600 rounded-xl text-[11px] font-bold border border-gray-100 hover:border-black hover:text-black transition-all cursor-default shadow-sm">
                #{tag}
                <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </span>
            ))}
            <form onSubmit={handleAddTag} className="inline-block relative">
              <input 
                type="text"
                placeholder="New label..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[11px] font-bold text-gray-400 placeholder:text-gray-200 w-24 p-0 ml-2"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
