import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

export default function QuantityPromptModal({ open, max, onClose, onSubmit, loading, error }) {
  const [cantidad, setCantidad] = useState(1);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (cantidad < 1 || cantidad > max) return;
    onSubmit(cantidad);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">¿Cuántas unidades quieres quitar?</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="number"
              min={1}
              max={max}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              autoFocus
              required
            />
            <div className="text-xs text-slate-500 mt-1">Máximo: {max}</div>
          </div>
          {error && <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded">{error}</div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? 'Procesando...' : 'Aceptar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
