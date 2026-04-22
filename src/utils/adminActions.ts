import { db, storage } from "@/lib/firebase";
import {
    doc,
    deleteDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

// --- Photo Actions ---

export async function deletePhoto(photoId: string, photoUrl: string) {
    try {
        // 1. Delete from Firestore
        await deleteDoc(doc(db, "photos", photoId));

        // 2. Delete from Storage
        // Extract path from URL or assume it's passed. 
        // For simplicity, we'll try to create a ref from the URL directly if possible,
        // or we might need to store the storage path in the photo document.
        // Firebase Storage refs can be created from HTTPS URLs.
        const storageRef = ref(storage, photoUrl);
        await deleteObject(storageRef);

        return { success: true };
    } catch (error) {
        console.error("Error deleting photo:", error);
        throw error;
    }
}

export async function updatePhoto(photoId: string, data: { name?: string; folderId?: string }) {
    try {
        const photoRef = doc(db, "photos", photoId);
        await updateDoc(photoRef, data);
        return { success: true };
    } catch (error) {
        console.error("Error updating photo:", error);
        throw error;
    }
}

// --- Folder Actions ---

export async function deleteFolder(folderId: string) {
    try {
        // 1. Get all photos in this folder
        const q = query(collection(db, "photos"), where("folderId", "==", folderId));
        const snapshot = await getDocs(q);

        // 2. Delete all photos (Firestore + Storage)
        const deletePromises = snapshot.docs.map((docSnap) => {
            const photoData = docSnap.data();
            return deletePhoto(docSnap.id, photoData.url);
        });

        await Promise.all(deletePromises);

        // 3. Delete the folder document
        await deleteDoc(doc(db, "folders", folderId));

        return { success: true };
    } catch (error) {
        console.error("Error deleting folder:", error);
        throw error;
    }
}

export async function updateFolder(
    folderId: string,
    data: { name?: string; type?: "public" | "private"; password?: string | null }
) {
    try {
        const folderRef = doc(db, "folders", folderId);
        await updateDoc(folderRef, data);
        return { success: true };
    } catch (error) {
        console.error("Error updating folder:", error);
        throw error;
    }
}
