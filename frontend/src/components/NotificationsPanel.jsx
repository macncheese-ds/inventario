import React, { useEffect, useState } from 'react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import api from '../api.js';

export default function NotificationsPanel({ notifications = [], fetchNotifications, toggleOrdered, onOpenItem, pollInterval = 30000 }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(notifications || []);
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => { setLocal(notifications || []); }, [notifications]);
  
  // lightweight polling if a fetch function is provided
  useEffect(() => {
    if (!fetchNotifications) return;
    const id = setInterval(() => {
      fetchNotifications().catch(() => {});
    }, pollInterval);
    return () => clearInterval(id);
  }, [fetchNotifications, pollInterval]);

  const count = (local || []).length;

  return (
    <div className="relative inline-block">
      <div className="relative inline-flex">
        <Button variant="secondary" size="md" onClick={() => setOpen(s => !s)} icon={(
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        )}>
          Notificaciones
        </Button>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold leading-none text-white bg-rose-600 rounded-full">{count}</span>
        )}
      </div>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 overflow-auto bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 p-2 z-40"
          style={{ maxHeight: expanded ? '60vh' : '20rem' }}
        >
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="text-sm font-semibold">Notificaciones</div>
            <div className="text-xs text-slate-500">{count}</div>
          </div>
          <ul className="space-y-2">
            {(expanded ? local : (local || []).slice(0, 8)).map(n => (
              <li key={n.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer" onClick={() => setSelectedItem(n)}>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.articulo}</div>
                  <div className="text-xs text-slate-500 truncate">Gaveta {n.gaveta} · Nivel {n.nivel} · Cant: {n.cantidad} (Mín: {n.min})</div>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs">{n.ordered ? <span className="text-amber-600">Ordered</span> : <span className="text-rose-600">Low</span>}</div>
                  <Button variant={n.ordered ? 'secondary' : 'primary'} size="xs" onClick={(e) => { e.stopPropagation(); toggleOrdered(n.id, !n.ordered); }}>
                    {n.ordered ? 'Unmark' : 'Mark'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs">
              <button className="text-xs text-indigo-600 hover:underline mr-4" onClick={() => { fetchNotifications && fetchNotifications(); }}>Refresh</button>
              {!expanded && count > 8 && (
                <button className="text-xs text-indigo-600 hover:underline" onClick={() => setExpanded(true)}>Show all</button>
              )}
              {expanded && (
                <button className="text-xs text-indigo-600 hover:underline" onClick={() => setExpanded(false)}>Collapse</button>
              )}
            </div>
            <div className="text-xs text-slate-400">Showing {expanded ? count : Math.min(8, count)}</div>
          </div>
        </div>
      )}

      {/* Detail modal similar to PrestarModal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold">Detalle de ítem</h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                {selectedItem.link ? (
                  <img src={selectedItem.link} alt={selectedItem.articulo} className="max-h-64 object-contain" />
                ) : (
                  <div className="text-slate-400">No image</div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">{selectedItem.articulo}</h4>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p><b>NDP:</b> {selectedItem.ndp || 'N/A'}</p>
                  <p><b>Ubicación:</b> Gaveta {selectedItem.gaveta} · Nivel {selectedItem.nivel}</p>
                  <p><b>Stock:</b> {selectedItem.cantidad} (Mín: {selectedItem.min}, Máx: {selectedItem.max})</p>
                  <p><b>Equipo:</b> {selectedItem.equipo || 'N/A'}</p>
                  <p><b>TDE:</b> {selectedItem.tde || 'N/A'}</p>
                  <p><b>Ordered:</b> {selectedItem.ordered ? `${selectedItem.ordered_by || ''} @ ${selectedItem.ordered_at || ''}` : 'No'}</p>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setSelectedItem(null)}>Cerrar</Button>
                  {onOpenItem && (
                    <Button variant="secondary" onClick={() => { onOpenItem(selectedItem); setSelectedItem(null); }}>Go to item</Button>
                  )}
                  <Button variant={selectedItem.ordered ? 'secondary' : 'primary'} onClick={async () => {
                    try {
                      await toggleOrdered(selectedItem.id, !selectedItem.ordered);
                      setSelectedItem(null);
                    } catch (e) {
                      console.error(e);
                    }
                  }}>{selectedItem.ordered ? 'Unmark ordered' : 'Mark ordered'}</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
