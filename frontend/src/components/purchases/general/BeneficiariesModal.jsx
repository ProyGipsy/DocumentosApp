// BeneficiariesModal.jsx actualizado
import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Autocomplete, Button, Box 
} from '@mui/material';

const customTextFieldStyle = {
    '& label.Mui-focused': { color: '#6d36ce' },
    '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#975cfc' } },
};

const darkButtonStyle = {
    backgroundColor: '#6d36ce', color: '#f4f4f4', fontWeight: 'bold',
    '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' }
};

// Agregamos banksList a los props destructurados
const BeneficiariesModal = ({ isOpen, onClose, mode = 'add', beneficiary = null, onSave, banksList = [] }) => {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        bank: '',    // Texto para el Autocomplete
        bankId: '',  // ID numérico para el backend
        account: '',
        observations: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && beneficiary) {
                setFormData({
                    id: beneficiary.id || '',
                    name: beneficiary.name || '',
                    bank: beneficiary.bank || '',   // Cargamos el nombre
                    bankId: beneficiary.bankId || '', // Cargamos el ID
                    account: beneficiary.account || '',
                    observations: beneficiary.observations || ''
                });
            } else {
                setFormData({ id: '', name: '', bank: '', bankId: '', account: '', observations: '' });
            }
        }
    }, [isOpen, mode, beneficiary]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBankChange = (event, newValue) => {
        // Buscamos el objeto del banco para extraer su ID
        const selectedBank = banksList.find(b => b.BankName === newValue);
        setFormData(prev => ({ 
            ...prev, 
            bank: newValue || '', 
            bankId: selectedBank ? selectedBank.BankID : '' 
        }));
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.bankId || !formData.account.trim()) {
            alert('Por favor, complete los campos obligatorios: Beneficiario, Banco y Número de Cuenta.');
            return;
        }
        // Validación de 20 dígitos interceptada según lo acordado
        if (formData.account.length !== 20) {
            alert(`La cuenta debe tener 20 dígitos (actualmente: ${formData.account.length}).`);
            return;
        }
        onSave(formData, mode);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                {mode === 'edit' ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
            </DialogTitle>
            <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label="Nombre del Beneficiario *" name="name" value={formData.name} onChange={handleChange} fullWidth size="small" sx={customTextFieldStyle} autoFocus />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Autocomplete
                        options={banksList.map((option) => option.BankName)}
                        value={formData.bank || null}
                        onChange={handleBankChange}
                        renderInput={(params) => (
                            <TextField {...params} label="Banco *" placeholder="Seleccione..." fullWidth size="small" sx={customTextFieldStyle} />
                        )}
                    />
                    <TextField
                        label="Número de Cuenta *" name="account" type="text"
                        value={formData.account}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) handleChange(e);
                        }}
                        fullWidth size="small" sx={customTextFieldStyle}
                        inputProps={{ maxLength: 20, inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Box>
                <TextField label="Observaciones" name="observations" multiline rows={2} value={formData.observations} onChange={handleChange} fullWidth size="small" sx={customTextFieldStyle} />
            </DialogContent>
            <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" sx={darkButtonStyle}>
                    {mode === 'edit' ? 'Guardar Cambios' : 'Agregar Beneficiario'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BeneficiariesModal;