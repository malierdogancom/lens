"use client";

import { useState, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Loader2, Upload, Lock, Globe, Plus, Folder, LogOut, ShieldAlert,
    Trash2, Edit2, MoreVertical, Image as ImageIcon, X, Check, Menu, MousePointer2
} from "lucide-react";
import ExifReader from "exifreader";
import { deleteFolder, deletePhoto, updateFolder, updatePhoto } from "@/utils/adminActions";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const ALLOWED_EMAILS = ['malilens@mali.com'];

export default function AdminPage() {
    const [folders, setFolders] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAllowed, setIsAllowed] = useState(false);
    const router = useRouter();

    // Selection State
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<any>(null);

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop default
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile default
    const [editingFolder, setEditingFolder] = useState<any>(null);
    const [editingPhoto, setEditingPhoto] = useState<any>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                if (currentUser.email && ALLOWED_EMAILS.includes(currentUser.email)) {
                    setIsAllowed(true);
                    fetchFolders();
                } else {
                    setIsAllowed(false);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedFolderId) {
            const folder = folders.find(f => f.id === selectedFolderId);
            setSelectedFolder(folder);
            fetchPhotos(selectedFolderId);
            // Reset selection when changing folders
            setIsSelectionMode(false);
            setSelectedPhotoIds(new Set());
            // Close mobile sidebar on selection
            setIsMobileSidebarOpen(false);
        } else {
            setSelectedFolder(null);
            setPhotos([]);
        }
    }, [selectedFolderId, folders]);

    const fetchFolders = async () => {
        try {
            const q = query(collection(db, "folders"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const folderList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFolders(folderList);
        } catch (error) {
            console.error("Error fetching folders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPhotos = async (folderId: string) => {
        try {
            const q = query(
                collection(db, "photos"),
                where("folderId", "==", folderId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching photos:", error);
        }
    };

    // --- Actions ---

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem("name") as HTMLInputElement).value;
        const isPrivate = (form.elements.namedItem("isPrivate") as HTMLInputElement).checked;
        const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

        try {
            await addDoc(collection(db, "folders"), {
                name,
                type: isPrivate ? "private" : "public",
                password: isPrivate ? password : null,
                createdAt: serverTimestamp(),
                coverImage: null,
            });
            setIsCreatingFolder(false);
            fetchFolders();
        } catch (error) {
            console.error("Error creating folder:", error);
            alert("Failed to create folder");
        }
    };

    const handleUpdateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFolder) return;

        try {
            await updateFolder(editingFolder.id, {
                name: editingFolder.name,
                type: editingFolder.type,
                password: editingFolder.password
            });
            setEditingFolder(null);
            fetchFolders();
        } catch (error) {
            alert("Failed to update folder");
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm("Are you sure? This will delete the folder and ALL photos inside it.")) return;

        try {
            await deleteFolder(folderId);
            if (selectedFolderId === folderId) setSelectedFolderId(null);
            fetchFolders();
        } catch (error) {
            alert("Failed to delete folder");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedFolderId) return;
        const files = Array.from(e.target.files);

        setUploading(true);
        let completed = 0;

        try {
            for (const file of files) {
                // Extract EXIF
                let exifData = {};
                try {
                    const tags = await ExifReader.load(file);
                    exifData = {
                        make: tags['Make']?.description || 'Unknown',
                        model: tags['Model']?.description || 'Unknown',
                        date: tags['DateTimeOriginal']?.description || new Date().toISOString(),
                        iso: tags['ISOSpeedRatings']?.description || 'N/A',
                        fNumber: tags['FNumber']?.description || 'N/A',
                        exposureTime: tags['ExposureTime']?.description || 'N/A',
                    };
                } catch (e) {
                    console.log("No EXIF data found");
                }

                // Upload to Storage
                const storageRef = ref(storage, `photos/${selectedFolderId}/${Date.now()}-${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                // Save to Firestore
                await addDoc(collection(db, "photos"), {
                    url,
                    folderId: selectedFolderId,
                    name: file.name,
                    createdAt: serverTimestamp(),
                    exif: exifData
                });

                completed++;
                setUploadProgress((completed / files.length) * 100);
            }

            fetchPhotos(selectedFolderId);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading photos");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            e.target.value = ""; // Reset input
        }
    };

    const handleDeletePhoto = async (photo: any) => {
        if (!confirm("Delete this photo?")) return;
        try {
            await deletePhoto(photo.id, photo.url);
            fetchPhotos(selectedFolderId!);
        } catch (error) {
            alert("Failed to delete photo");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedPhotoIds.size} selected photos?`)) return;

        try {
            const photosToDelete = photos.filter(p => selectedPhotoIds.has(p.id));
            await Promise.all(photosToDelete.map(p => deletePhoto(p.id, p.url)));

            fetchPhotos(selectedFolderId!);
            setIsSelectionMode(false);
            setSelectedPhotoIds(new Set());
        } catch (error) {
            alert("Failed to delete selected photos");
        }
    };

    const togglePhotoSelection = (photoId: string) => {
        const newSelection = new Set(selectedPhotoIds);
        if (newSelection.has(photoId)) {
            newSelection.delete(photoId);
        } else {
            newSelection.add(photoId);
        }
        setSelectedPhotoIds(newSelection);
    };

    const handleUpdatePhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPhoto) return;
        try {
            await updatePhoto(editingPhoto.id, {
                name: editingPhoto.name,
                folderId: editingPhoto.folderId
            });
            setEditingPhoto(null);
            fetchPhotos(selectedFolderId!);
        } catch (error) {
            alert("Failed to update photo");
        }
    };


    if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>;
    if (!isAllowed) return (
        <div className="flex h-screen flex-col items-center justify-center bg-black text-white gap-4">
            <ShieldAlert className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-400">You are not authorized to view this page.</p>
            <button onClick={() => signOut(auth)} className="text-blue-400 hover:underline">Sign Out</button>
        </div>
    );

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Folder Manager */}
            <div className={twMerge(
                "fixed md:relative z-50 h-full w-80 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300",
                !isMobileSidebarOpen && "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Folder className="w-5 h-5 text-blue-500" />
                        Folders
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsCreatingFolder(true)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors md:hidden">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isCreatingFolder && (
                        <form onSubmit={handleCreateFolder} className="p-3 bg-gray-800 rounded-lg mb-2 border border-blue-500/50">
                            <input name="name" placeholder="Folder Name" className="w-full bg-gray-900 p-2 rounded text-sm mb-2 border border-gray-700 focus:border-blue-500 outline-none" autoFocus required />
                            <div className="flex items-center gap-2 mb-3">
                                <input type="checkbox" id="new-private" name="isPrivate" className="rounded bg-gray-700 border-gray-600"
                                    onChange={(e) => {
                                        const passInput = document.getElementById('new-pass') as HTMLInputElement;
                                        if (passInput) passInput.style.display = e.target.checked ? 'block' : 'none';
                                    }}
                                />
                                <label htmlFor="new-private" className="text-xs text-gray-400">Private</label>
                            </div>
                            <input id="new-pass" name="password" type="password" placeholder="Password" className="w-full bg-gray-900 p-2 rounded text-sm mb-2 border border-gray-700 hidden" />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-1 rounded text-xs font-medium">Create</button>
                                <button type="button" onClick={() => setIsCreatingFolder(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs">Cancel</button>
                            </div>
                        </form>
                    )}

                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={twMerge(
                                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                selectedFolderId === folder.id ? "bg-blue-900/20 border border-blue-500/30" : "hover:bg-gray-800 border border-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {folder.type === 'private' ? <Lock className="w-4 h-4 text-orange-400 flex-shrink-0" /> : <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />}
                                <span className="truncate text-sm font-medium">{folder.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); }}
                                    className="p-1.5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                    className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content - Photo Manager */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                {/* Mobile Header */}
                <div className="md:hidden h-14 border-b border-gray-800 flex items-center px-4 bg-gray-900">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-2 font-bold">Admin Dashboard</span>
                </div>

                {!selectedFolderId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                        <Folder className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a folder from the sidebar to manage contents</p>
                    </div>
                ) : (
                    <>
                        <header className="h-auto min-h-[4rem] border-b border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-3 gap-3 bg-black/50 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                <h1 className="text-xl font-bold truncate">{selectedFolder?.name}</h1>
                                <span className={twMerge("text-xs px-2 py-0.5 rounded-full border flex-shrink-0", selectedFolder?.type === 'private' ? "border-orange-500/30 text-orange-400 bg-orange-500/10" : "border-green-500/30 text-green-400 bg-green-500/10")}>
                                    {selectedFolder?.type}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                                {isSelectionMode ? (
                                    <>
                                        <button
                                            onClick={() => { setIsSelectionMode(false); setSelectedPhotoIds(new Set()); }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm whitespace-nowrap"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={selectedPhotoIds.size === 0}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm disabled:opacity-50 whitespace-nowrap"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete ({selectedPhotoIds.size})
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsSelectionMode(true)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm whitespace-nowrap"
                                        >
                                            <MousePointer2 className="w-4 h-4" />
                                            Select
                                        </button>
                                        <label className={twMerge("flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap", uploading ? "bg-gray-800 cursor-wait" : "bg-blue-600 hover:bg-blue-500")}>
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <span className="text-sm font-medium">{uploading ? `${Math.round(uploadProgress)}%` : "Upload"}</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                                        </label>
                                    </>
                                )}
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {photos.map(photo => (
                                    <div
                                        key={photo.id}
                                        onClick={() => isSelectionMode && togglePhotoSelection(photo.id)}
                                        className={twMerge(
                                            "group relative aspect-square bg-gray-900 rounded-lg overflow-hidden border transition-all cursor-pointer",
                                            isSelectionMode && selectedPhotoIds.has(photo.id) ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-800 hover:border-gray-600"
                                        )}
                                    >
                                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />

                                        {isSelectionMode ? (
                                            <div className={twMerge(
                                                "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                selectedPhotoIds.has(photo.id) ? "bg-blue-500 border-blue-500" : "border-white/50 bg-black/20"
                                            )}>
                                                {selectedPhotoIds.has(photo.id) && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }}
                                                        className="p-1.5 bg-gray-800 hover:bg-blue-600 rounded-full text-white transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo); }}
                                                        className="p-1.5 bg-gray-800 hover:bg-red-600 rounded-full text-white transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-300 truncate">{photo.name}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {photos.length === 0 && (
                                <div className="text-center text-gray-500 mt-20">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No photos yet</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Edit Folder Modal */}
            {editingFolder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 w-full max-w-md rounded-xl border border-gray-800 p-6">
                        <h3 className="text-lg font-bold mb-4">Edit Folder</h3>
                        <form onSubmit={handleUpdateFolder} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Name</label>
                                <input
                                    value={editingFolder.name}
                                    onChange={e => setEditingFolder({ ...editingFolder, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editingFolder.type === 'private'}
                                    onChange={e => setEditingFolder({ ...editingFolder, type: e.target.checked ? 'private' : 'public' })}
                                    className="rounded bg-gray-700 border-gray-600"
                                />
                                <label className="text-sm text-gray-300">Private Folder</label>
                            </div>
                            {editingFolder.type === 'private' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Password</label>
                                    <input
                                        value={editingFolder.password || ''}
                                        onChange={e => setEditingFolder({ ...editingFolder, password: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                        placeholder="Set password"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingFolder(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Photo Modal */}
            {editingPhoto && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 w-full max-w-md rounded-xl border border-gray-800 p-6">
                        <h3 className="text-lg font-bold mb-4">Edit Photo</h3>
                        <form onSubmit={handleUpdatePhoto} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Title</label>
                                <input
                                    value={editingPhoto.name}
                                    onChange={e => setEditingPhoto({ ...editingPhoto, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Move to Folder</label>
                                <select
                                    value={editingPhoto.folderId}
                                    onChange={e => setEditingPhoto({ ...editingPhoto, folderId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                >
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingPhoto(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
