// --- Photo Actions ---

export async function deletePhoto(photoId: string) {
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete photo');
    return { success: true };
}

export async function updatePhoto(photoId: string, data: { name?: string; folderId?: string }) {
    const res = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update photo');
    return { success: true };
}

// --- Folder Actions ---

export async function deleteFolder(folderId: string) {
    const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete folder');
    return { success: true };
}

export async function updateFolder(
    folderId: string,
    data: { name?: string; type?: "public" | "private"; password?: string | null }
) {
    const res = await fetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update folder');
    return { success: true };
}
