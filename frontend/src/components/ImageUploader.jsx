import React, { useState, useRef } from 'react';
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
      
      let uploadUrl = '';
      if (!apiUrl) {
        uploadUrl = window.location.origin + '/api/upload/upload';
      } else {
        // Since we're proxying through nginx, just use relative path
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
      // Sanitize returned image path in case it contains an accidental host prefix like '/10.229.52.84/uploads/...'
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
        <div className="relative">
          {previewImage ? (
            <div className="relative group">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-32 h-32 rounded-md object-contain border-4 border-gray-600 shadow-lg bg-white" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-32 h-32 rounded-md bg-gray-700 border-4 border-gray-600 flex items-center justify-center shadow-lg"
                style={previewImage ? {display: 'none'} : {}}
              >
                <span className="text-gray-400 text-xs">Error cargando imagen</span>
              </div>
              <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">✕</button>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs">Clic para cambiar</span></div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-md bg-gray-700 border-4 border-gray-600 flex items-center justify-center shadow-lg"><span className="text-gray-400 text-xs">Sin imagen</span></div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          {isUploading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Subiendo...</>) : (<><span>📷</span>{previewImage ? 'Cambiar' : 'Subir'} Imagen</>)}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {uploadError && <div className="text-red-400 text-sm text-center">{uploadError}</div>}
      <div className="text-gray-400 text-xs text-center space-y-1"><p>Formatos soportados: JPEG, PNG, GIF, WebP</p><p>Tamaño máximo: 10MB</p></div>
    </div>
  );
};

export default ImageUploader;