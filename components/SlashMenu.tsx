"use client";

import { Heading1, Heading2, List, CheckSquare, Mic, Image as ImageIcon, Type, Sparkles, Youtube, Figma, Twitter, Code } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";

interface SlashMenuProps {
  editor: Editor;
  position?: { top: number; left: number };
  onSelect?: (command: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function SlashMenu({ editor, position, onSelect, onClose, className }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = [
    { id: "h1", label: "Heading 1", icon: Heading1, desc: "Big landing title" },
    { id: "h2", label: "Heading 2", icon: Heading2, desc: "Section header" },
    { id: "h3", label: "Heading 3", icon: Type, desc: "Subsection" },
    { id: "bullet", label: "Bullet List", icon: List, desc: "Simple list" },
    { id: "todo", label: "To-do List", icon: CheckSquare, desc: "Track tasks" },
    { id: "code", label: "Code Block", icon: Code, desc: "Syntax highlighting" },
    { id: "sep", variant: "divider" },
    { id: "image", label: "Image", icon: ImageIcon, desc: "Upload image & OCR" },
    { id: "voice", label: "Voice Note", icon: Mic, desc: "Record & AI summarize" },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(items[selectedIndex].id);
      } else if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedIndex]);

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
    if (onClose) onClose();
  };

  if (!position) return null;

  return (
    <motion.div 
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={clsx(
        "fixed z-50 min-w-[240px] glass border border-gray-100 rounded-2xl shadow-2xl p-2",
        className
      )}
      style={{ top: position.top + 8, left: position.left }}
    >
      <div className="px-3 py-2 flex items-center gap-2 mb-1 border-b border-gray-50">
         <Sparkles className="w-3 h-3 text-black" />
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commands</span>
      </div>
      <div className="space-y-0.5 max-h-[40vh] overflow-y-auto custom-scrollbar">
        {items.map((item, index: number) => {
          if (item.variant === "divider") {
            return <div key={`sep-${index}`} className="h-px bg-gray-50 my-1 mx-2" />;
          }
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group",
                index === selectedIndex ? "bg-black text-white" : "hover:bg-gray-50 text-gray-700"
              )}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={clsx(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                index === selectedIndex ? "bg-white/10 text-white" : "bg-gray-100 text-gray-400 group-hover:text-black"
              )}>
                {item.icon && <item.icon className="w-4 h-4" />}
              </div>
              <div>
                <p className={clsx("text-[12px] font-bold", index === selectedIndex ? "text-white" : "text-black")}>
                  {item.label}
                </p>
                <p className={clsx("text-[9px] font-medium uppercase tracking-wider", index === selectedIndex ? "text-gray-400" : "text-gray-400")}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
