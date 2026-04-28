import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Autocomplete, Button, Box 
} from '@mui/material';

// --- ESTILOS REUTILIZABLES ---
const customTextFieldStyle = {
    '& label.Mui-focused': { color: '#6d36ce' },
    '& .MuiOutlinedInput-root': {
        '&.Mui-focused fieldset': { borderColor: '#975cfc' },
    },
};

const darkButtonStyle = {
    backgroundColor: '#6d36ce', 
    color: '#f4f4f4', 
    fontWeight: 'bold', 
    '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' }
};

// Mock de bancos (En el futuro provendrá del backend)
const mockBanksList = ['Banesco', 'Mercantil', 'Provincial', 'BNC', 'Banco de Venezuela', 'Banplus'];

const BeneficiariesModal = ({ isOpen, onClose, mode = 'add', beneficiary = null, onSave }) => {
    // --- ESTADO DEL FORMULARIO ---
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        bank: '',
        account: '',
        observations: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && beneficiary) {
                setFormData({
                    id: beneficiary.id || '',
                    name: beneficiary.name || '',
                    bank: beneficiary.bank || '',
                    account: beneficiary.account || '',
                    observations: beneficiary.observations || ''
                });
            } else {
                // Reset al abrir para agregar
                setFormData({ id: '', name: '', bank: '', account: '', observations: '' });
            }
        }
    }, [isOpen, mode, beneficiary]);

    // --- MANEJO DE CAMBIOS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBankChange = (event, newValue) => {
        setFormData(prev => ({ ...prev, bank: newValue || '' }));
    };

    // --- GUARDAR Y VALIDAR ---
    const handleSave = () => {
        // Validaciones básicas
        if (!formData.name.trim() || !formData.bank || !formData.account.trim()) {
            alert('Por favor, complete los campos obligatorios: Beneficiario, Banco y Número de Cuenta.');
            return;
        }

        // Llamar al callback del componente padre
        onSave(formData, mode);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                {mode === 'edit' ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
            </DialogTitle>
            
            <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                <TextField
                    label="Nombre del Beneficiario *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={customTextFieldStyle}
                    autoFocus
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Autocomplete
                        options={mockBanksList}
                        value={formData.bank || null}
                        onChange={handleBankChange}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Banco *" 
                                placeholder="Seleccione..."
                                fullWidth 
                                size="small" 
                                sx={customTextFieldStyle} 
                            />
                        )}
                    />

                    {/* Input Numérico con bloqueo de teclas no deseadas */}
                    <TextField
                        label="Número de Cuenta *"
                        name="account"
                        type="number"
                        value={formData.account}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={customTextFieldStyle}
                        onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                                e.preventDefault();
                            }
                        }}
                    />
                </Box>

                <TextField
                    label="Observaciones"
                    name="observations"
                    multiline
                    rows={2}
                    value={formData.observations}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={customTextFieldStyle}
                    placeholder="Detalles adicionales..."
                />

            </DialogContent>

            <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} variant="contained" sx={darkButtonStyle}>
                    {mode === 'edit' ? 'Guardar Cambios' : 'Agregar Beneficiario'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BeneficiariesModal;