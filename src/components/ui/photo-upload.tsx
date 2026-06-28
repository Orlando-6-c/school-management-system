'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
    name: string;
    defaultValue?: string;
    size?: 'sm' | 'md';
}

export function PhotoUpload({ name, defaultValue = '', size = 'md' }: PhotoUploadProps) {
    const [url, setUrl] = useState(defaultValue);
    const [preview, setPreview] = useState(defaultValue);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const dim = size === 'sm' ? 'w-20 h-20' : 'w-28 h-28';

    async function handleFile(file: File) {
        if (!file.type.startsWith('image/')) { setError('Only images allowed'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }

        setError('');
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: form });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 503) {
                    // Blob not configured — fall back to base64 (works in dev without Vercel Blob)
                    const reader = new FileReader();
                    reader.onloadend = () => { setUrl(reader.result as string); };
                    reader.readAsDataURL(file);
                } else {
                    throw new Error(data.error ?? 'Upload failed');
                }
            } else {
                setUrl(data.url);
            }
        } catch (err: any) {
            setError(err.message);
            setPreview(url);
        } finally {
            setUploading(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        setUrl('');
        setPreview('');
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div className="space-y-1.5">
            <input type="hidden" name={name} value={url} />

            {preview ? (
                <div className={`relative ${dim} group`}>
                    <img src={preview} alt="Photo" className={`${dim} rounded-lg object-cover border border-border`} />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="p-1.5 bg-white/90 rounded-md text-foreground hover:bg-white transition-colors"
                            title="Change photo"
                        >
                            <Camera size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="p-1.5 bg-red-500 rounded-md text-white hover:bg-red-600 transition-colors"
                            title="Remove photo"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => inputRef.current?.click()}
                    className={`${dim} border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors`}
                >
                    <Upload size={18} className="text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground text-center px-1">Click or drag</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />

            {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading…</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
