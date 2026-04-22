import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Photo {
    id: string;
    url: string;
    name?: string;
}

export async function downloadPhotosAsZip(photos: Photo[], zipFilename: string) {
    const zip = new JSZip();
    const folder = zip.folder("photos");

    if (!folder) return;

    const promises = photos.map(async (photo) => {
        try {
            // Use the proxy API to bypass CORS
            const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(photo.url)}`);
            if (!response.ok) throw new Error("Network response was not ok");

            const blob = await response.blob();
            const filename = photo.name || `photo-${photo.id}.jpg`;
            folder.file(filename, blob);
        } catch (error) {
            console.error(`Failed to download photo ${photo.id}:`, error);
        }
    });

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${zipFilename}.zip`);
}
