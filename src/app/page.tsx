"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Folder, Lock, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE
  ? new Date(process.env.NEXT_PUBLIC_BUILD_DATE).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null;

export default function HomePage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const q = query(collection(db, "folders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setFolders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse">Loading Gallery...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Portfolio Gallery
        </h1>
        <p className="text-gray-400">Explore my collections</p>
        {buildDate && <p className="text-xs text-gray-600 mt-2">Son güncelleme: {buildDate}</p>}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {folders.map((folder, index) => (
          <Link href={`/folder/${folder.id}`} key={folder.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all cursor-pointer"
            >
              {/* Cover Image Placeholder or Actual Image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

              {folder.coverImage ? (
                <img
                  src={folder.coverImage}
                  alt={folder.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 group-hover:bg-gray-700 transition-colors">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Folder className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-semibold">
                      Collection
                    </span>
                  </div>
                  {folder.type === "private" && (
                    <div className="bg-black/50 backdrop-blur-md p-2 rounded-full">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {folder.name}
                </h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </main>
  );
}
