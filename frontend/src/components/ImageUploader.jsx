import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import api from '../api.js';

const ImageUploader = ({ currentImage, onImageChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage || null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo debe ser menor a 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      
      // Construct upload URL - debug the process step by step
      const apiUrl = import.meta.env.VITE_API_URL;
      console.debug('VITE_API_URL:', apiUrl);
      console.debug('window.location.origin:', window.location.origin);

      // Prefer explicit API base URL when provided (useful when nginx proxy not configured)
      let uploadUrl = '';
      if (apiUrl && apiUrl !== '') {
        // ensure no trailing slash
        uploadUrl = apiUrl.replace(/\/+$/,'') + '/upload/upload';
      } else if (window.location.origin && window.location.hostname !== 'localhost') {
        // try to use the current origin + /api (for proxied setups)
        uploadUrl = window.location.origin + '/api/upload/upload';
      } else {
        // fallback to relative path
        uploadUrl = '/api/upload/upload';
      }
      
      console.debug('Final upload URL ->', uploadUrl);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Upload failed', res.status, text);
        throw new Error('Error uploading');
      }
      const data = await res.json();
      // Sanitize returned image path in case it contains an accidental host prefix like '/10.229.52.220/uploads/...'
      let imagePath = data.imageUrl || '';
      try {
        const baseHost = new URL(uploadUrl).hostname;
        if (imagePath.startsWith('/' + baseHost + '/')) {
          imagePath = imagePath.replace('/' + baseHost, '');
        }
      } catch (e) {
        // ignore
      }
      // Since nginx now proxies both /api/ and /uploads/, we can use relative URLs
      const fullUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://') ? imagePath : imagePath;
      if (!fullUrl) throw new Error('Invalid upload response');
      console.debug('Image uploaded, preview URL ->', fullUrl);
      setPreviewImage(fullUrl);
      if (onImageChange) onImageChange(fullUrl);
    } catch (e) {
      console.error(e);
      setUploadError('Error al subir la imagen');
      setPreviewImage(currentImage);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    if (onImageChange) onImageChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative group">
          {previewImage ? (
            <>
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-32 h-32 rounded-lg object-contain border-2 border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hidden"
              >
                <span className="text-slate-400 text-xs">Error cargando</span>
              </div>
              <button 
                type="button" 
                onClick={removeImage} 
                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                title="Eliminar imagen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div 
                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-white text-xs font-medium">Cambiar</span>
              </div>
            </>
          ) : (
            <div 
              className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0l5.172 5.172m0 0l1.414-1.414a2 2 0 012.828 0l2.83 2.83M9 12l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span className="text-slate-400 text-xs">Sin imagen</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading} 
          variant="secondary"
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Subiendo...
            </span>
          ) : (
            <span>{previewImage ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
          )}
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {uploadError && <div className="text-rose-500 text-sm text-center">{uploadError}</div>}
      <div className="text-slate-400 text-xs text-center space-y-1">
        <p>Formatos: JPEG, PNG, GIF, WebP</p>
        <p>Máximo: 10MB</p>
      </div>
    </div>
  );
};

export default ImageUploader;