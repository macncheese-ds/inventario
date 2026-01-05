// QR Bulk Modal - Generate and print multiple QR codes at once
import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';

// Tamaños predefinidos para impresión
const SIZES = {
  small: { qr: 60, label: 'Pequeño (6x6 por hoja)', cols: 6, rows: 6 },
  medium: { qr: 100, label: 'Mediano (4x4 por hoja)', cols: 4, rows: 4 },
  large: { qr: 150, label: 'Grande (3x3 por hoja)', cols: 3, rows: 3 },
  xlarge: { qr: 200, label: 'Extra Grande (2x2 por hoja)', cols: 2, rows: 2 },
};

export default function QRBulkModal({ open, items, onClose, allItems = [] }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [size, setSize] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [filterGaveta, setFilterGaveta] = useState('');
  const canvasContainerRef = useRef(null);

  // Usar items pasados o allItems
  const availableItems = items?.length > 0 ? items : allItems;

  // Obtener gavetas únicas
  const gavetas = [...new Set(availableItems.map(i => i.gaveta))].sort((a, b) => Number(a) - Number(b));

  // Filtrar items
  const filteredItems = availableItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.articulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ndp?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGaveta = !filterGaveta || item.gaveta?.toString() === filterGaveta;
    return matchesSearch && matchesGaveta;
  });

  useEffect(() => {
    if (!open) {
      setSelectedItems([]);
      setSearchTerm('');
      setSelectAll(false);
      setFilterGaveta('');
    }
  }, [open]);

  const toggleItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredItems]);
    }
    setSelectAll(!selectAll);
  };

  const generateQRData = (item) => JSON.stringify({
    id: item.id,
    ndp: item.ndp,
    articulo: item.articulo,
    gaveta: item.gaveta,
    nivel: item.nivel
  });

  const handlePrintBulk = () => {
    if (selectedItems.length === 0) return;
    
    const sizeConfig = SIZES[size];
    const printWindow = window.open('', '_blank');
    
    // Generar HTML para cada QR
    const qrHtml = selectedItems.map((item, idx) => `
      <div class="qr-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizeConfig.qr} ${sizeConfig.qr}" id="qr-${idx}"></svg>
        <div class="qr-label">
          <div class="ndp">${item.ndp || 'N/A'}</div>
          <div class="name">${item.articulo?.substring(0, 20) || ''}</div>
          <div class="loc">G${item.gaveta}-N${item.nivel}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Inventario</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { 
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 5mm;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(${sizeConfig.cols}, 1fr);
              gap: 3mm;
              page-break-inside: auto;
            }
            .qr-item {
              border: 1px solid #333;
              padding: 2mm;
              text-align: center;
              page-break-inside: avoid;
              background: white;
            }
            .qr-item canvas, .qr-item svg {
              width: ${sizeConfig.qr}px !important;
              height: ${sizeConfig.qr}px !important;
              max-width: 100%;
            }
            .qr-label {
              margin-top: 1mm;
              font-size: ${size === 'small' ? '6px' : size === 'medium' ? '8px' : '10px'};
              line-height: 1.2;
            }
            .ndp {
              font-weight: bold;
              font-family: monospace;
              background: #eee;
              padding: 1px 3px;
              display: inline-block;
              font-size: ${size === 'small' ? '7px' : size === 'medium' ? '9px' : '11px'};
            }
            .name {
              margin-top: 1px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .loc {
              color: #666;
              font-size: ${size === 'small' ? '5px' : size === 'medium' ? '7px' : '9px'};
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">${qrHtml}</div>
          <script>
            const items = ${JSON.stringify(selectedItems.map(item => ({
              id: item.id,
              ndp: item.ndp,
              articulo: item.articulo,
              gaveta: item.gaveta,
              nivel: item.nivel
            })))};
            
            items.forEach((item, idx) => {
              const data = JSON.stringify(item);
              const container = document.getElementById('qr-' + idx);
              if (container) {
                QRCode.toCanvas(document.createElement('canvas'), data, { 
                  width: ${sizeConfig.qr},
                  margin: 1
                }, function(error, canvas) {
                  if (!error) {
                    container.parentNode.replaceChild(canvas, container);
                  }
                });
              }
            });
            
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 1000);
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadAllPNG = async () => {
    if (selectedItems.length === 0) return;
    setDownloading(true);

    try {
      // Descargar cada QR como PNG individual
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        await downloadSinglePNG(item);
        // Pequeña pausa para evitar problemas con descargas múltiples
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      setDownloading(false);
    }
  };

  const downloadSinglePNG = (item) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const padding = 15;
      const qrSize = 150;
      const textHeight = 60;
      
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + textHeight;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      // Generate QR using library
      import('qrcode.react').then(({ QRCodeCanvas }) => {
        // Create temp container for QR
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const qrData = generateQRData(item);
        
        // Use native canvas QR generation
        const qrCanvas = document.createElement('canvas');
        const qrCtx = qrCanvas.getContext('2d');
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        
        // Draw simple QR placeholder and use external lib
        import('qrcode').then((QRCode) => {
          QRCode.toCanvas(qrCanvas, qrData, { width: qrSize, margin: 1 }, (error) => {
            if (!error) {
              ctx.drawImage(qrCanvas, padding, padding);
            }
            
            // Draw text
            ctx.textAlign = 'center';
            
            // NDP background
            ctx.fillStyle = '#333333';
            ctx.fillRect(padding, qrSize + padding + 5, qrSize, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(item.ndp || 'N/A', canvas.width / 2, qrSize + padding + 18);
            
            // Article name
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 10px Arial';
            const articleText = item.articulo?.length > 25 ? item.articulo.substring(0, 25) + '...' : item.articulo;
            ctx.fillText(articleText || '', canvas.width / 2, qrSize + padding + 38);
            
            // Location
            ctx.font = '9px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText(`Gaveta: ${item.gaveta} | Nivel: ${item.nivel}`, canvas.width / 2, qrSize + padding + 52);
            
            // Download
            const link = document.createElement('a');
            link.download = `QR_${item.ndp || item.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            document.body.removeChild(tempDiv);
            resolve();
          });
        }).catch(() => {
          document.body.removeChild(tempDiv);
          resolve();
        });
      });
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Generar QR en Lote
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-3 mb-4 flex-shrink-0">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por artículo o NDP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <select
            value={filterGaveta}
            onChange={(e) => setFilterGaveta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            <option value="">Todas las gavetas</option>
            {gavetas.map(g => (
              <option key={g} value={g}>Gaveta {g}</option>
            ))}
          </select>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            {Object.entries(SIZES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Info de selección */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="rounded border-slate-300"
            />
            Seleccionar todos ({filteredItems.length})
          </label>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {selectedItems.length} seleccionados
          </span>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left w-10"></th>
                <th className="px-3 py-2 text-left">NDP</th>
                <th className="px-3 py-2 text-left">Artículo</th>
                <th className="px-3 py-2 text-left">Gaveta</th>
                <th className="px-3 py-2 text-left">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => toggleItem(item)}
                  className={`cursor-pointer transition-colors ${
                    selectedItems.find(i => i.id === item.id) 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selectedItems.find(i => i.id === item.id)}
                      onChange={() => toggleItem(item)}
                      className="rounded border-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-900 dark:text-white">{item.ndp}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.articulo}</td>
                  <td className="px-3 py-2 text-slate-500">{item.gaveta}</td>
                  <td className="px-3 py-2 text-slate-500">{item.nivel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-500">No se encontraron items</div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex-1"></div>
          <Button 
            onClick={handleDownloadAllPNG}
            disabled={selectedItems.length === 0 || downloading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Descargando...' : `Descargar PNG (${selectedItems.length})`}
          </Button>
          <Button 
            onClick={handlePrintBulk}
            disabled={selectedItems.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir ({selectedItems.length})
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          Selecciona el tamaño según cuántos QR quieres por hoja. Los PNG se descargan individualmente.
        </p>
      </Card>
    </div>
  );
}
