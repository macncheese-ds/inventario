import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

export default function PasswordPromptModal({ open, onClose, onSubmit, loading, error, label }) {
    const [password, setPassword] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setPassword('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{label || 'Ingrese contraseña'}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            ref={inputRef}
                            type="password"
                            placeholder="Contraseña..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !password}>
                            {loading ? 'Verificando...' : 'Confirmar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
