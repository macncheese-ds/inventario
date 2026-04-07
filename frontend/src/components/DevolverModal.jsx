import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

export default function DevolverModal({ open, prestamo, onClose, onSubmit }) {
    const [password, setPassword] = useState('');

    if (!open || !prestamo) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({ prestamo_id: prestamo.id, password });
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
                    <Input
                        type="password"
                        label="Contraseña (Opcional / Admin)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Si se requiere autorización..."
                    />

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
