// QR Code Modal Component for printing item QR codes
import React, { useRef, useCallback } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';
import { trLocal } from '../i18n/index.js';

export default function QRModal({ open, item, onClose, baseUrl }) {
  const printRef = useRef(null);
  const canvasRef = useRef(null);

  if (!open || !item) return null;

  // Generate QR data - includes item ID and basic info for scanning
  const qrData = JSON.stringify({
    id: item.id,
    ndp: item.ndp,
    articulo: item.articulo,
    gaveta: item.gaveta,
    nivel: item.nivel
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${item.articulo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #333;
              padding: 15px;
              border-radius: 8px;
              max-width: 300px;
            }
            .qr-code {
              margin: 10px auto;
            }
            .item-info {
              margin-top: 10px;
              font-size: 12px;
              color: #333;
            }
            .item-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
              word-break: break-word;
            }
            .item-ndp {
              font-family: monospace;
              font-size: 16px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 4px;
              margin: 5px 0;
            }
            .item-location {
              font-size: 11px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .qr-container {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadPNG = () => {
    // Create a canvas with the QR code and text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const padding = 20;
    const qrSize = 200;
    const textHeight = 80;
    
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Get QR code from hidden canvas
    const qrCanvas = canvasRef.current?.querySelector('canvas');
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);
    }
    
    // Draw text
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    
    // NDP
    ctx.font = 'bold 16px monospace';
    ctx.fillRect(padding, qrSize + padding + 5, qrSize, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.ndp || 'N/A', canvas.width / 2, qrSize + padding + 22);
    
    // Article name
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    const articleText = item.articulo?.length > 30 ? item.articulo.substring(0, 30) + '...' : item.articulo;
    ctx.fillText(articleText || '', canvas.width / 2, qrSize + padding + 45);
    
    // Location
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(`Gaveta: ${item.gaveta} | Nivel: ${item.nivel}`, canvas.width / 2, qrSize + padding + 62);
    
    // Download
    const link = document.createElement('a');
    link.download = `QR_${item.ndp || item.id}_${item.articulo?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Código QR</h3>
          <button 
            onClick={onClose}
            className="px-2.5 py-1 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-150"
          >
            {trLocal('close')}
          </button>
        </div>

        {/* Hidden canvas for PNG generation */}
        <div ref={canvasRef} className="hidden">
          <QRCodeCanvas 
            value={qrData}
            size={200}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Contenido imprimible */}
        <div ref={printRef}>
          <div className="qr-container bg-white p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600">
            <div className="qr-code flex justify-center">
              <QRCodeSVG 
                value={qrData}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="item-info mt-3 text-center">
              <div className="item-ndp text-lg font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded inline-block text-slate-900 dark:text-white">
                {item.ndp || 'N/A'}
              </div>
              <div className="item-name text-sm font-semibold mt-2 text-slate-800 dark:text-slate-200">
                {item.articulo}
              </div>
              <div className="item-location text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gaveta: {item.gaveta} | Nivel: {item.nivel}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} className="text-sm">
            {trLocal('close')}
          </Button>
          <Button onClick={handleDownloadPNG} variant="secondary" className="text-sm">
            PNG
          </Button>
          <Button onClick={handlePrint} variant="primary" className="col-span-2 text-sm">
            Imprimir
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
          Escanea este código QR para identificar rápidamente el producto
        </p>
      </Card>
    </div>
  );
}
