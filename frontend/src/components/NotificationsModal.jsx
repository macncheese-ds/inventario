import React, { useEffect, useState } from 'react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';

export default function NotificationsModal({ open, onClose, notifications = [], fetchNotifications, toggleOrdered, onOpenItem }) {
  const [q, setQ] = useState('');
  const [filterArticulo, setFilterArticulo] = useState('');
  const [filterGaveta, setFilterGaveta] = useState('');
  const [local, setLocal] = useState([]);
  const [viewMode, setViewMode] = useState('interleaved'); // 'interleaved' | 'pending' | 'ordered'

  useEffect(() => { setLocal(notifications || []); }, [notifications]);

  useEffect(() => {
    if (open) fetchNotifications && fetchNotifications();
  }, [open]);

  const filtered = local.filter(it => {
    const matchQ = !q || ((it.articulo || '').toLowerCase().includes(q.toLowerCase()) || (it.ndp || '').toLowerCase().includes(q.toLowerCase()));
    const matchArticulo = !filterArticulo || ((it.articulo || '').toLowerCase().includes(filterArticulo.toLowerCase()));
    const matchG = !filterGaveta || String(it.gaveta) === String(filterGaveta);
    return matchQ && matchArticulo && matchG;
  });

  const orderedItems = filtered.filter(it => it.ordered);
  const pendingItems = filtered.filter(it => !it.ordered);
  // interleave pending and ordered to avoid stacked lists
  const interleaved = [];
  const maxLen = Math.max(pendingItems.length, orderedItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < pendingItems.length) interleaved.push({ ...pendingItems[i], __state: 'pending' });
    if (i < orderedItems.length) interleaved.push({ ...orderedItems[i], __state: 'ordered' });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-stretch justify-center p-0 z-50">
      <Card className="w-full h-full max-h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold">Notificaciones</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por NDP, artículo..." />
          <Input value={filterArticulo} onChange={e => setFilterArticulo(e.target.value)} placeholder="Filtrar por artículo" />
          <Input value={filterGaveta} onChange={e => setFilterGaveta(e.target.value)} placeholder="Filtrar por gaveta" />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setQ(''); setFilterArticulo(''); setFilterGaveta(''); }}>{'Limpiar'}</Button>
            <Button onClick={() => fetchNotifications && fetchNotifications()} variant="primary">Refresh</Button>
          </div>
          <div className="flex items-center">
            <Button variant="secondary" onClick={() => {
              // cycle modes
              setViewMode(m => m === 'interleaved' ? 'pending' : m === 'pending' ? 'ordered' : 'interleaved');
            }}>{viewMode === 'interleaved' ? 'Intercalar' : viewMode === 'pending' ? 'Pendientes' : 'Ordenados'}</Button>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold">Resultados: { (viewMode === 'interleaved' ? interleaved.length : viewMode === 'pending' ? pendingItems.length : orderedItems.length) } (Pendientes: {pendingItems.length} · Ordenados: {orderedItems.length})</h4>
            <div className="text-sm text-slate-500">Vista: {viewMode === 'interleaved' ? 'Intercalada' : viewMode === 'pending' ? 'Pendientes' : 'Ordenados'}</div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">NDP</th>
                <th className="px-4 py-2">Artículo</th>
                <th className="px-4 py-2">Gaveta</th>
                <th className="px-4 py-2">Nivel</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Mín</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Ordenado por</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(viewMode === 'interleaved' ? interleaved : viewMode === 'pending' ? pendingItems.map(it => ({ ...it, __state: 'pending' })) : orderedItems.map(it => ({ ...it, __state: 'ordered' }))).map((it, idx) => (
                <tr key={`${it.id}-${idx}`} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2 text-xs text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-2">{it.ndp || 'N/A'}</td>
                  <td className="px-4 py-2">{it.articulo}</td>
                  <td className="px-4 py-2">{it.gaveta}</td>
                  <td className="px-4 py-2">{it.nivel}</td>
                  <td className="px-4 py-2">{it.cantidad}</td>
                  <td className="px-4 py-2">{it.min}</td>
                  <td className="px-4 py-2">{it.__state === 'ordered' ? <span className="text-amber-600">Ordenado</span> : <span className="text-rose-600">Pendiente</span>}</td>
                  <td className="px-4 py-2">{it.ordered_by || '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {it.__state === 'ordered' ? (
                        <Button variant="secondary" size="xs" onClick={() => toggleOrdered(it.id, false)}>Unmark</Button>
                      ) : (
                        <Button variant="primary" size="xs" onClick={() => toggleOrdered(it.id, true)}>Mark</Button>
                      )}
                      <Button variant="secondary" size="xs" onClick={() => onOpenItem && onOpenItem(it)}>Go to item</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </Card>
    </div>
  );
}
