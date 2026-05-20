import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Button, Box, Typography, MenuItem, Divider
} from '@mui/material';

const styles = {
    customTextField: { '& label.Mui-focused': { color: '#6d36ce' }, '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#975cfc' } } },
    successButton: { backgroundColor: '#2e7d32', color: '#ffffff', fontWeight: 'bold', borderRadius: '16px', padding: '8px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#1b5e20' } }
};

const ValidatePurchaseModal = ({ isOpen, onClose, purchase, onConfirm, user }) => {
    const [validationData, setValidationData] = useState({
        receptionDate: new Date().toISOString().split('T')[0],
        receivedAmountUSD: '',
        receivedExchangeRate: '',
        referenceNumber: '',
        receivingBank: '',
        receivingAccount: '',
        settlementStatus: 'Completada',
        observations: ''
    });

    useEffect(() => {
        if (isOpen && purchase) {
            setValidationData({
                receptionDate: purchase.date || new Date().toISOString().split('T')[0],
                receivedAmountUSD: purchase.dollarsBought || '',
                receivedExchangeRate: purchase.exchangeRate || '',
                referenceNumber: '',
                receivingBank: purchase.destBank || '',
                receivingAccount: purchase.destAccount || '',
                settlementStatus: 'Completada',
                observations: ''
            });
        }
    }, [isOpen, purchase]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setValidationData(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirm = () => {
        onConfirm(purchase.id, { 
            ...validationData, 
            validatedBy: user ? user.id : 'Desconocido' 
        });
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' }}}>
            <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#e8f5e9', borderBottom: '1px solid #ddd', color: '#2e7d32' }}>
                Validar Liquidación de Compra
            </DialogTitle>
            <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {purchase && (
                    <Box sx={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Proveedor: <strong>{purchase.provider}</strong></Typography>
                        <Typography variant="body2" color="textSecondary">Destino Esperado: <strong>{purchase.destBank}</strong></Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Monto Esperado: <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${purchase.dollarsBought}</span>
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField label="Monto Real Recibido ($)" name="receivedAmountUSD" type="number" value={validationData.receivedAmountUSD} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ step: "any" }} />
                    <TextField label="Tasa Aplicada (Bs.)" name="receivedExchangeRate" type="number" value={validationData.receivedExchangeRate} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ step: "any" }} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField label="Número de Referencia" name="referenceNumber" value={validationData.referenceNumber} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} />
                    <TextField label="Estatus de Liquidación" name="settlementStatus" select value={validationData.settlementStatus} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField}>
                        <MenuItem value="Completada">Completada</MenuItem>
                        <MenuItem value="Parcial">Parcial (Cobro Comisiones)</MenuItem>
                        <MenuItem value="Rechazada">Rechazada / Devuelta</MenuItem>
                    </TextField>
                </Box>

                <Box sx={{ width: '50%' }}>
                    <TextField label="Fecha de Recepción" name="receptionDate" type="date" value={validationData.receptionDate} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={styles.customTextField} />
                </Box>

                <TextField label="Observaciones / Comentarios" name="observations" multiline rows={3} value={validationData.observations} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} placeholder="Añade detalles sobre la transferencia..." />

            </DialogContent>
            
            <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                <Button onClick={handleConfirm} variant="contained" sx={styles.successButton}>Confirmar Liquidación</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ValidatePurchaseModal;