/**
 * Compresses an image to reduce file size before uploading
 * @param file The image file to compress
 * @param maxWidth Maximum width (default: 1024px)
 * @param maxHeight Maximum height (default: 1024px)
 * @param quality JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image as Blob
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                
                // Use better image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`📦 Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`);
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

/**
 * Converts a File object (from web) to a base64 data URL with optional compression.
 * @param blob The File or Blob object to convert.
 * @param compress Whether to compress the image (default: true for images)
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = async (blob: Blob, compress: boolean = true): Promise<string> => {
    // If it's an image and compression is enabled, compress first
    if (compress && blob.type.startsWith('image/')) {
        try {
            const compressedBlob = await compressImage(blob as File);
            blob = compressedBlob;
        } catch (error) {
            console.warn('Image compression failed, using original:', error);
        }
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(blob);
    });
};

/**
 * Gets a default profile picture URL based on gender
 * Uses DiceBear avatars for consistent, gender-appropriate illustrations
 * @param gender The user's gender ('male', 'female', or other)
 * @param seed A unique seed for the avatar (e.g., user's name or id)
 * @returns URL to a default avatar image
 */
export const getDefaultAvatar = (gender: string, seed: string): string => {
    // Use DiceBear's avataaars style which supports gender-specific options
    const encodedSeed = encodeURIComponent(seed);
    
    if (gender === 'male') {
        // Male avatar with short hair styles
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&top=shortHair&facialHair=beardLight,beardMajestic,moustacheFancy,moustacheMagnum,blank&facialHairProbability=50&accessories=prescription01,prescription02,blank&accessoriesProbability=30`;
    } else if (gender === 'female') {
        // Female avatar with longer hair styles
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&top=longHair,hat&facialHairProbability=0&accessories=prescription01,prescription02,blank&accessoriesProbability=30`;
    } else {
        // Neutral/unspecified - use a friendly neutral style
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&facialHairProbability=0`;
    }
};
