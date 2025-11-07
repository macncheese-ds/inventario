import React, { useState } from 'react';

export default function QuantityPromptModal({ open, max, onClose, onSubmit, loading, error }) {
  const [cantidad, setCantidad] = useState(1);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (cantidad < 1 || cantidad > max) return;
    onSubmit(cantidad);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-xs bg-slate-900 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-semibold mb-2">¿Cuántas unidades quieres quitar?</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="number"
              min={1}
              max={max}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-800 border-slate-700 text-white"
              autoFocus
              required
            />
            <div className="text-xs text-slate-400 mt-1">Máximo: {max}</div>
          </div>
          {error && <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Cancelar</button>
            <button type="submit" className="px-3 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50" disabled={loading}>{loading ? 'Procesando...' : 'Aceptar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
