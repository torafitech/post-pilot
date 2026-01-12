'use client';

import { DragEvent, useRef, useState } from 'react';

interface FileUploadProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    acceptedTypes?: string;
    maxSizeMB?: number;
}

export default function FileUpload({
    onUploadComplete,
    acceptedTypes = 'image/*,video/*',
    maxSizeMB = 100,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    //   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    //   const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = 'datrs1ouj'
    const uploadPreset = 'postpilot_upload';
    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            alert(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Determine file type
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        setFileType(type);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        await uploadToCloudinary(file, type);
    };

    const uploadToCloudinary = async (file: File, type: 'image' | 'video') => {
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset!);
            formData.append('folder', 'postpilot');

            // Determine resource type
            const resourceType = type === 'video' ? 'video' : 'image';

            // Upload with progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const secureUrl = response.secure_url;
                    onUploadComplete(secureUrl, type);
                    setUploading(false);
                } else {
                    throw new Error('Upload failed');
                }
            });

            xhr.addEventListener('error', () => {
                alert('Upload failed. Please try again.');
                setUploading(false);
            });

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
            xhr.send(formData);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
            setUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const clearFile = () => {
        setPreview(null);
        setFileType(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            {!preview ? (
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${dragActive
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={acceptedTypes}
                        onChange={handleChange}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="space-y-4">
                            <div className="text-4xl animate-bounce">☁️</div>
                            <div className="text-gray-700 font-medium">Uploading to cloud...</div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="text-sm text-gray-600">{progress}% complete</div>
                        </div>
                    ) : (
                        <>
                            <div className="text-5xl mb-4">
                                {dragActive ? '📥' : '📁'}
                            </div>
                            <p className="text-gray-700 font-medium mb-2">
                                {dragActive ? 'Drop your file here!' : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports: Images (JPG, PNG, GIF) & Videos (MP4, MOV)
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Max size: {maxSizeMB}MB
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="relative">
                    {/* Preview */}
                    <div className="border-2 border-purple-300 rounded-lg overflow-hidden bg-gray-50">
                        {fileType === 'image' ? (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-64 object-contain"
                            />
                        ) : (
                            <video
                                src={preview}
                                className="w-full h-64 object-contain"
                                controls
                            />
                        )}
                    </div>

                    {/* Success Badge */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        ✓ Uploaded to Cloud
                    </div>

                    {/* Clear Button */}
                    <button
                        type="button"
                        onClick={clearFile}
                        className="mt-3 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                    >
                        🗑️ Remove & Upload Different File
                    </button>
                </div>
            )}
        </div>
    );
}
