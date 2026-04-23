import React from 'react';
import Button from './ui/Button';

export default function DevolverModal({ open, prestamo, onClose, onSubmit }) {
    if (!open || !prestamo) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ prestamo_id: prestamo.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Devolver Artículo</h3>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Artículo:</strong> {prestamo.articulo}</p>
                    <p><strong>Empleado:</strong> {prestamo.nombre_empleado} ({prestamo.num_empleado})</p>
                    <p><strong>Cantidad:</strong> {prestamo.cantidad}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                        ¿Confirmas la devolución de {prestamo.cantidad} unidad{prestamo.cantidad !== 1 ? 'es' : ''} de {prestamo.articulo}?
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Confirmar Devolución
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
