// Firebase Storage Service - Image Upload
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Compresses an image to reduce file size before upload
 */
const compressImage = async (base64Data: string, maxWidth: number = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Scale down if larger than maxWidth
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                'image/jpeg',
                0.7 // 70% quality
            );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64Data;
    });
};

/**
 * Uploads a single image to Firebase Storage
 * @param base64Image - Base64 encoded image string
 * @param reportId - ID of the report (for organizing storage)
 * @param index - Image index for naming
 * @returns Download URL of the uploaded image
 */
export const uploadReportImage = async (
    base64Image: string,
    reportId: string,
    index: number
): Promise<string> => {
    try {
        // Compress image first
        const blob = await compressImage(base64Image);

        // Create storage reference
        const imagePath = `reports/${reportId}/image_${index}_${Date.now()}.jpg`;
        const storageRef = ref(storage, imagePath);

        // Upload
        const snapshot = await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
    }
};

/**
 * Uploads multiple images for a report
 * @param base64Images - Array of base64 image strings
 * @param reportId - ID of the report
 * @returns Array of download URLs
 */
export const uploadReportImages = async (
    base64Images: string[],
    reportId: string
): Promise<string[]> => {
    const uploadPromises = base64Images.map((img, index) =>
        uploadReportImage(img, reportId, index)
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
};
