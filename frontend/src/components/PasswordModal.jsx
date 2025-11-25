import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import api from '../api';

export default function PasswordModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Las nuevas contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccess('Contraseña actualizada correctamente');
            setTimeout(() => {
                onClose();
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cambiar Contraseña</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        label="Contraseña Actual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            {success}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
