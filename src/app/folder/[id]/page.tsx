"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Lock, Unlock, ArrowLeft, Download, CheckCircle2, X, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import DownloadPlugin from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import { downloadPhotosAsZip } from "@/utils/downloadUtils";
import { saveAs } from "file-saver";

export default function FolderPage() {
    const { id } = useParams();
    const [folder, setFolder] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(true);
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");

    // Professional Features State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (id) fetchFolder();
    }, [id]);

    const fetchFolder = async () => {
        try {
            const docRef = doc(db, "folders", id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFolder(data);
                if (data.type === "public") {
                    setLocked(false);
                    fetchPhotos();
                }
            }
        } catch (error) {
            console.error("Error fetching folder:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPhotos = async () => {
        try {
            const q = query(
                collection(db, "photos"),
                where("folderId", "==", id),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            setPhotos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching photos:", error);
        }
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === folder.password) {
            setLocked(false);
            setError("");
            fetchPhotos();
        } else {
            setError("Incorrect password");
        }
    };

    const toggleSelection = (photoId: string) => {
        const newSelection = new Set(selectedPhotoIds);
        if (newSelection.has(photoId)) {
            newSelection.delete(photoId);
        } else {
            newSelection.add(photoId);
        }
        setSelectedPhotoIds(newSelection);
    };

    const handlePhotoClick = (index: number, photoId: string) => {
        if (isSelectionMode) {
            toggleSelection(photoId);
        } else {
            setCurrentImageIndex(index);
            setLightboxOpen(true);
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloading(true);
        await downloadPhotosAsZip(photos, `${folder.name}-all`);
        setIsDownloading(false);
    };

    const handleDownloadSelected = async () => {
        setIsDownloading(true);
        const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
        await downloadPhotosAsZip(selectedPhotos, `${folder.name}-selected`);
        setIsDownloading(false);
        setIsSelectionMode(false);
        setSelectedPhotoIds(new Set());
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse">Loading Folder...</div>
            </div>
        );
    }

    if (!folder) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Folder Not Found</h1>
                    <Link href="/" className="text-blue-400 hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    if (locked) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{folder.name}</h1>
                    <p className="text-gray-400 mb-8">This folder is password protected</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter Password"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest"
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Unlock className="w-4 h-4" />
                            Unlock Gallery
                        </button>
                    </form>

                    <Link href="/" className="block mt-6 text-gray-500 hover:text-white text-sm">
                        ← Back to Gallery
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <header className="mb-8 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold truncate">{folder.name}</h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {isSelectionMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedPhotoIds(new Set());
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleDownloadSelected}
                                disabled={selectedPhotoIds.size === 0 || isDownloading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                {isDownloading ? (
                                    <span className="animate-pulse">Zipping...</span>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download Selected ({selectedPhotoIds.size})
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <MousePointer2 className="w-4 h-4" />
                                Select
                            </button>
                            <button
                                onClick={handleDownloadAll}
                                disabled={isDownloading || photos.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                {isDownloading ? (
                                    <span className="animate-pulse">Zipping...</span>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download All ({photos.length})
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {photos.map((photo, index) => (
                    <TiltCard
                        key={photo.id}
                        photo={photo}
                        index={index}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedPhotoIds.has(photo.id)}
                        onClick={() => handlePhotoClick(index, photo.id)}
                    />
                ))}
            </div>

            {photos.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                    No photos in this folder yet.
                </div>
            )}

            {/* Lightbox */}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={currentImageIndex}
                on={{
                    view: ({ index }) => setCurrentImageIndex(index),
                }}
                slides={photos.map(p => ({ src: p.url }))}
                plugins={[DownloadPlugin]}
                render={{
                    buttonDownload: () => (
                        <button
                            type="button"
                            className="yarl__button"
                            onClick={() => {
                                const photo = photos[currentImageIndex];
                                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(photo.url)}`;
                                const filename = photo.name || `photo-${photo.id}.jpg`;
                                saveAs(proxyUrl, filename);
                            }}
                        >
                            <Download />
                        </button>
                    )
                }}
            />
        </div>
    );
}

function TiltCard({
    photo,
    index,
    isSelectionMode,
    isSelected,
    onClick
}: {
    photo: any;
    index: number;
    isSelectionMode: boolean;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group perspective-1000 cursor-pointer"
            onClick={onClick}
        >
            <div className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 border transition-all duration-300 transform ${isSelected
                    ? "border-blue-500 ring-2 ring-blue-500 scale-[0.98]"
                    : "border-gray-800 group-hover:scale-[1.02] group-hover:shadow-2xl shadow-blue-500/20"
                }`}>
                <img
                    src={photo.url}
                    alt={photo.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? "opacity-60" : ""}`}
                    loading="lazy"
                />

                {/* Selection Overlay */}
                {isSelectionMode && (
                    <div className={`absolute top-3 right-3 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-white/50 bg-black/20"
                        }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                )}

                {/* EXIF Overlay (Only show if not selecting) */}
                {!isSelectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="text-xs text-gray-300 space-y-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            {photo.exif?.make && <p>{photo.exif.make} {photo.exif.model}</p>}
                            {photo.exif?.fNumber && (
                                <div className="flex gap-3 text-gray-400 font-mono">
                                    <span>ƒ/{photo.exif.fNumber}</span>
                                    <span>{photo.exif.exposureTime}s</span>
                                    <span>ISO {photo.exif.iso}</span>
                                </div>
                            )}
                            <p className="text-gray-500 text-[10px] mt-2 truncate">{photo.name}</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
