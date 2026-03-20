"use client";

import { useAuth } from "@/context/AuthContext";
import { LogIn, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-gray-100 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[35%] h-[35%] bg-gray-50 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass border border-gray-100 p-10 sm:p-12 rounded-[3.5rem] shadow-2xl relative z-10 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-black rounded-3xl shadow-2xl shadow-gray-200 flex items-center justify-center mb-10 group overflow-hidden relative">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <Sparkles className="w-10 h-10 text-white relative z-10" />
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight">Nodal Corona</h1>
          <p className="text-sm text-gray-400 font-medium max-w-[200px] mx-auto leading-relaxed">
            Your refined second brain for editorial clarity.
          </p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-black text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-xl shadow-gray-200"
        >
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-black text-xs uppercase tracking-[0.2em]">Enter Workspace</span>
        </button>

        <div className="mt-10 flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
           <ShieldCheck className="w-3.5 h-3.5" />
           Secure Authorized Access Only
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-widest relative z-10">
        &copy; 2026 Crafted with Excellence
      </p>
    </div>
  );
}
