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

const documentPrefixes = ['V', 'E', 'J', 'G', 'P'];

const BeneficiariesModal = ({ isOpen, onClose, mode = 'add', beneficiary = null, onSave, banksList = [] }) => {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        documentPrefix: '',
        documentNumber: '',
        email: '',
        bank: '',
        bankId: '',
        account: '',
        observations: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && beneficiary) {
                setFormData({
                    id: beneficiary.id || '',
                    name: beneficiary.name || '',
                    documentPrefix: beneficiary.documentPrefix || '',
                    documentNumber: beneficiary.documentNumber || '',
                    email: beneficiary.email || '',
                    bank: beneficiary.bank || '',
                    bankId: beneficiary.bankId || '',
                    account: beneficiary.account || '',
                    observations: beneficiary.observations || ''
                });
            } else {
                setFormData({ 
                    id: '', name: '', documentPrefix: '', documentNumber: '', 
                    email: '', bank: '', bankId: '', account: '', observations: '' 
                });
            }
        }
    }, [isOpen, mode, beneficiary]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBankChange = (event, newValue) => {
        const selectedBank = banksList.find(b => b.BankName === newValue);
        setFormData(prev => ({ 
            ...prev, 
            bank: newValue || '', 
            bankId: selectedBank ? selectedBank.BankID : '' 
        }));
    };

    const handleSave = () => {
        // Validaciones base
        if (!formData.name.trim() || !formData.documentPrefix || !formData.documentNumber.trim() || !formData.email.trim() || !formData.bankId || !formData.account.trim()) {
            alert('Por favor, complete los campos obligatorios: Nombre, Identificación, Correo Electrónico, Banco y Número de Cuenta.');
            return;
        }
        if (formData.account.length !== 20) {
            alert(`La cuenta debe tener 20 dígitos (actualmente: ${formData.account.length}).`);
            return;
        }

        // --- VALIDACIÓN Y FORMATO DE IDENTIFICACIÓN (Imita las reglas de SQL Server) ---
        let cleanNumber = formData.documentNumber.replace(/[^0-9]/g, ''); // Asegura que solo hay números
        const prefix = formData.documentPrefix;

        if (prefix === 'V' || prefix === 'E') {
            if (cleanNumber.length > 8) {
                alert('La cédula (V/E) no puede exceder los 8 dígitos.');
                return;
            }
            // Rellena con ceros a la izquierda hasta llegar a 8 dígitos (ej. "7123456" -> "07123456")
            cleanNumber = cleanNumber.padStart(8, '0'); 
        } 
        else if (prefix === 'J') {
            if (cleanNumber.length > 9) {
                alert('El RIF (J) no puede exceder los 9 dígitos.');
                return;
            }
            // Rellena con ceros hasta llegar a 9 dígitos
            cleanNumber = cleanNumber.padStart(9, '0');
        } 
        else if (prefix === 'P') {
            if (cleanNumber.length > 12) {
                alert('El pasaporte (P) no puede exceder los 12 dígitos.');
                return;
            }
            // Mínimo de 8 dígitos según tu restricción
            cleanNumber = cleanNumber.padStart(8, '0'); 
        }

        // Creamos una copia del estado con el número ya procesado para enviarlo al backend
        const payloadToSave = {
            ...formData,
            documentNumber: cleanNumber
        };

        // Pasamos el payload formateado a la función de Beneficiaries.jsx
        onSave(payloadToSave, mode);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                {mode === 'edit' ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {/* Nombre */}
                <TextField label="Nombre del Proveedor *" name="name" value={formData.name} onChange={handleChange} fullWidth size="small" sx={customTextFieldStyle} autoFocus />
                
                {/* Identificación y Correo */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 1.5fr', gap: 2 }}>
                    <Autocomplete
                        options={documentPrefixes}
                        value={formData.documentPrefix}
                        disableClearable
                        onChange={(e, val) => setFormData(p => ({ ...p, documentPrefix: val }))}
                        renderInput={(params) => <TextField {...params} label="Tipo" size="small" sx={customTextFieldStyle} />}
                    />
                    <TextField 
                        label="Identificación *" 
                        name="documentNumber" 
                        value={formData.documentNumber} 
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) handleChange(e);
                        }} 
                        fullWidth size="small" sx={customTextFieldStyle} 
                        inputProps={{ maxLength: 12 }} // Limita la escritura máxima a 12 caracteres (Pasaporte)
                    />
                    <TextField 
                        label="Correo Electrónico *" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        fullWidth size="small" sx={customTextFieldStyle} 
                    />
                </Box>

                {/* Banco y Cuenta */}
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
                
                {/* Observaciones */}
                <TextField label="Observaciones" name="observations" multiline rows={2} value={formData.observations} onChange={handleChange} fullWidth size="small" sx={customTextFieldStyle} />
            
            </DialogContent>
            <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" sx={darkButtonStyle}>
                    {mode === 'edit' ? 'Guardar Cambios' : 'Agregar Proveedor'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BeneficiariesModal;