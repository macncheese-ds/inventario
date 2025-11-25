import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

export default function PrestarModal({ open, item, onClose, onSubmit }) {
    const [numEmpleado, setNumEmpleado] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setNumEmpleado('');
            setCantidad(1);
            setError('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!numEmpleado.trim()) {
            setError('Ingresa el número de empleado');
            return;
        }
        if (cantidad < 1 || cantidad > (item?.cantidad || 0)) {
            setError(`Cantidad inválida (Máx: ${item?.cantidad})`);
            return;
        }
        onSubmit({ item_id: item.id, num_empleado: numEmpleado, cantidad });
        onClose();
    };

    if (!open || !item) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Prestar Artículo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {item.articulo} (Disp: {item.cantidad})
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        ref={inputRef}
                        label="Número de Empleado"
                        value={numEmpleado}
                        onChange={(e) => setNumEmpleado(e.target.value)}
                        placeholder="Escanea o escribe..."
                    />

                    <Input
                        type="number"
                        label="Cantidad"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        min={1}
                        max={item.cantidad}
                    />

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Prestar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
