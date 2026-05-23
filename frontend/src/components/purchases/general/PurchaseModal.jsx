import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Autocomplete, Button, Box, Typography, Divider 
} from '@mui/material';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const styles = {
    customTextField: { '& label.Mui-focused': { color: '#6d36ce' }, '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#975cfc' } } },
    darkButton: { backgroundColor: '#6d36ce', color: '#f4f4f4', fontWeight: 'bold', borderRadius: '16px', padding: '10px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' } },
    sectionTitle: { color: '#421d83', fontSize: '1rem', fontWeight: 'medium', mt: 2, mb: 0.2 }
};

const PurchaseModal = ({ 
    isOpen, onClose, editingId, initialData, onSave, 
    originEntities = [], destEntities = [], beneficiariesList = [], banksList = []
}) => {

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        
        // --- 1. Origen ---
        originEntity: '', originEntityId: '',
        originBank: '', originBankId: '',
        originAccount: '', originAccountId: '',

        // --- 2. Destino ---
        destEntity: '', destEntityId: '',
        destBank: '', destBankId: '',
        destAccount: '', destAccountId: '',

        // --- 3. Proveedor ---
        provider: '', providerId: '', 
        providerBank: '', providerBankId: '', 
        providerAccount: '',

        // --- 4. Compra ---
        dollarsBought: '', exchangeRate: '', bolivares: '', observations: ''
    });

    const [originBanksList, setOriginBanksList] = useState([]);
    const [originBankIsSelected, setOriginBankIsSelected] = useState(false);
    const [originAccountsList, setOriginAccountsList] = useState([]);
    const [originAccountIsSelected, setOriginAccountIsSelected] = useState(false);
    
    const [destBanksList, setDestBanksList] = useState([]);
    const [destBankIsSelected, setDestBankIsSelected] = useState(false);
    const [destAccountsList, setDestAccountsList] = useState([]);
    const [destAccountIsSelected, setDestAccountIsSelected] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingId && initialData) {
                const selectedProvider = beneficiariesList.find(
                    b => b.id === initialData.providerId || b.name === initialData.provider
                );

                setFormData({
                    ...initialData,
                    providerBank: selectedProvider ? selectedProvider.bank : '',
                    providerBankId: selectedProvider ? selectedProvider.bankId : '',
                    providerAccount: selectedProvider ? selectedProvider.account : ''
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    originEntity: '', originEntityId: '', originBank: '', originBankId: '', originAccount: '', originAccountId: '',
                    destEntity: '', destEntityId: '', destBank: '', destBankId: '', destAccount: '', destAccountId: '',
                    provider: '', providerId: '', providerBank: '', providerBankId: '', providerAccount: '',
                    dollarsBought: '', exchangeRate: '', bolivares: '', observations: ''
                });
            }
        }
    }, [isOpen, editingId, initialData, beneficiariesList]); 

    useEffect(() => {
        const fetchOriginBanks = async () => {
            if (!formData.originEntityId) { setOriginBanksList([]); return; }
            const token = sessionStorage.getItem('session_token');
            
            setOriginBankIsSelected(false);
            try {
                //const res = await fetch(`${apiUrl}/purchases/getBanksByNationalEntity/${formData.originEntityId}?currency_id=1`, { headers: { 'Authorization': `Bearer ${token}` }});
                const res = await fetch(`${apiUrl}/availability/entities/${formData.originEntityId}/banks`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (res.ok) setOriginBanksList(await res.json());
            } catch (error) { 
                console.error("Error fetching origin banks:", error);
            } finally {
                setOriginBankIsSelected(true);
            }
        };
        
        fetchOriginBanks();
    }, [formData.originEntityId]);

    useEffect(() => {
        const fetchOriginAccounts = async () => {
            if (!formData.originBankId || !formData.originEntityId) { setOriginAccountsList([]); return; }
            const token = sessionStorage.getItem('session_token');
            try {
                //const res = await fetch(`${apiUrl}/purchases/getOriginAccounts/${formData.originBankId}?entity_id=${formData.originEntityId}`, { headers: { 'Authorization': `Bearer ${token}` }});
                const res = await fetch(`${apiUrl}/availability/banks/${formData.originBankId}/accounts?entity_id=${formData.originEntityId}`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (res.ok) setOriginAccountsList(await res.json());
            } catch (error) { 
                console.error("Error fetching origin accounts:", error);
            } finally {
                setOriginAccountIsSelected(true);
            }
        };

        fetchOriginAccounts();
    }, [formData.originBankId, formData.originEntityId]);

    useEffect(() => {
        const fetchDestBanks = async () => {
            if (!formData.destEntityId) { setDestBanksList([]); return; }
            const token = sessionStorage.getItem('session_token');
            try {
                const res = await fetch(`${apiUrl}/purchases/getBanksByNationalEntity/${formData.destEntityId}?currency_id=2`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (res.ok) setDestBanksList(await res.json());
            } catch (error) { 
                console.error("Error fetching dest banks:", error);
            } finally {
                setDestBankIsSelected(true);
            }
        };

        fetchDestBanks();
    }, [formData.destEntityId]);

    useEffect(() => {
        const fetchDestAccounts = async () => {
            if (!formData.destBankId || !formData.destEntityId) { setDestAccountsList([]); return; }
            const token = sessionStorage.getItem('session_token');
            try {
                const res = await fetch(`${apiUrl}/purchases/getDestinationAccounts/${formData.destBankId}?entity_id=${formData.destEntityId}`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (res.ok) setDestAccountsList(await res.json());
            } catch (error) { 
                console.error("Error fetching dest accounts:", error);
            } finally {
                setDestAccountIsSelected(true);
            }
        };

        fetchDestAccounts();
    }, [formData.destBankId, formData.destEntityId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'dollarsBought' || name === 'exchangeRate') {
                const dollars = parseFloat(newData.dollarsBought);
                const rate = parseFloat(newData.exchangeRate);
                if (!isNaN(dollars) && !isNaN(rate)) {
                    newData.bolivares = (dollars * rate).toFixed(2);
                }
            }
            return newData;
        });
    };

    const handleLocalSave = () => {
        onSave(formData);
    };

    const getBankName = (b) => b.BankName || b.name || '';
    const getBankId = (b) => b.BankID || b.id || '';
    const getAccName = (a) => a.AccountNumber || a.accountNumber || '';
    const getAccId = (a) => a.AccountID || a.id || '';

    return (
        <Dialog 
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ 
                sx: { 
                    borderRadius: '16px',
                    maxWidth: '800px', 
                } 
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                {editingId ? 'Editar Compra' : 'Registrar Nueva Compra'}
            </DialogTitle>
            
            <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* --- SECCIÓN 0: FECHA --- */}
                <Box sx={{ width: '30%', mb: 1 }}>
                    <TextField label="Fecha de la Operación" name="date" type="date" value={formData.date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={styles.customTextField} />
                </Box>

                {/* --- SECCIÓN 1: ORIGEN --- */}
                <Typography sx={styles.sectionTitle}>Origen de los Fondos</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 1 }}>
                    <Autocomplete
                        options={originEntities.map(e => e.name || e.EntityName)}
                        value={formData.originEntity || null}
                        onChange={(e, val) => {
                            const selected = originEntities.find(ent => (ent.name || ent.EntityName) === val);
                            setFormData(prev => ({ ...prev, originEntity: val || '', originEntityId: selected ? (selected.id || selected.EntityID) : '', originBank: '', originBankId: '', originAccount: '', originAccountId: '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Empresa Origen" fullWidth size="small" sx={styles.customTextField} />}
                    />
                    <Autocomplete
                        options={originBanksList.map(getBankName)} 
                        value={formData.originBank || null}
                        onChange={(e, val) => {
                            const selected = originBanksList.find(b => getBankName(b) === val);
                            setFormData(prev => ({ ...prev, originBank: val || '', originBankId: selected ? getBankId(selected) : '', originAccount: '', originAccountId: '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Banco Origen" fullWidth size="small" sx={styles.customTextField} disabled={!formData.originEntityId && !originBankIsSelected} />}
                    />
                    <Autocomplete
                        options={originAccountsList.map(getAccName)} 
                        value={formData.originAccount || null}
                        onChange={(e, val) => {
                            const selected = originAccountsList.find(a => getAccName(a) === val);
                            setFormData(prev => ({ ...prev, originAccount: val || '', originAccountId: selected ? getAccId(selected) : '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Cuenta Origen" fullWidth size="small" sx={styles.customTextField} disabled={!formData.originBankId && !originAccountIsSelected} />}
                    />
                </Box>

                {/* --- SECCIÓN 2: DESTINO --- */}
                <Typography sx={styles.sectionTitle}>Destino de los Fondos</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 1 }}>
                    <Autocomplete
                        options={destEntities.map(e => e.name || e.EntityName)}
                        value={formData.destEntity || null}
                        onChange={(e, val) => {
                            const selected = destEntities.find(ent => (ent.name || ent.EntityName) === val);
                            setFormData(prev => ({ ...prev, destEntity: val || '', destEntityId: selected ? (selected.id || selected.EntityID) : '', destBank: '', destBankId: '', destAccount: '', destAccountId: '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Empresa Destino" fullWidth size="small" sx={styles.customTextField} />}
                    />
                    <Autocomplete
                        options={destBanksList.map(getBankName)} 
                        value={formData.destBank || null}
                        onChange={(e, val) => {
                            const selected = destBanksList.find(b => getBankName(b) === val);
                            setFormData(prev => ({ ...prev, destBank: val || '', destBankId: selected ? getBankId(selected) : '', destAccount: '', destAccountId: '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Banco Destino" fullWidth size="small" sx={styles.customTextField} disabled={!formData.destEntityId && !destBankIsSelected} />}
                    />
                    <Autocomplete
                        options={destAccountsList.map(getAccName)} 
                        value={formData.destAccount || null}
                        onChange={(e, val) => {
                            const selected = destAccountsList.find(a => getAccName(a) === val);
                            setFormData(prev => ({ ...prev, destAccount: val || '', destAccountId: selected ? getAccId(selected) : '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Cuenta Destino" fullWidth size="small" sx={styles.customTextField} disabled={!formData.destBankId && !destAccountIsSelected} />}
                    />
                </Box>

                {/* --- SECCIÓN 3: PROVEEDOR --- */}
                <Typography sx={styles.sectionTitle}>Proveedor</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 1 }}>
                    <Autocomplete
                        options={beneficiariesList.map(b => b.name)}
                        value={formData.provider || null}
                        onChange={(event, newValue) => {
                            const selectedProvider = beneficiariesList.find(b => b.name === newValue);
                            setFormData(prev => ({ 
                                ...prev, 
                                provider: newValue || '', 
                                providerId: selectedProvider ? selectedProvider.id : '',
                                providerBank: selectedProvider ? selectedProvider.bank : '',
                                providerBankId: selectedProvider ? selectedProvider.bankId : '',
                                providerAccount: selectedProvider ? selectedProvider.account : ''
                            }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Proveedor" fullWidth size="small" sx={styles.customTextField} />}
                    />
                    <Autocomplete
                        options={banksList.map(b => getBankName(b))}
                        value={formData.providerBank || null}
                        readOnly
                        onChange={(event, newValue) => {
                            const selectedBank = banksList.find(b => getBankName(b) === newValue);
                            setFormData(prev => ({ ...prev, providerBank: newValue || '', providerBankId: selectedBank ? getBankId(selectedBank) : '' }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Banco Proveedor" fullWidth size="small" sx={styles.customTextField} />}
                    />
                    <TextField 
                        label="Cuenta Proveedor" name="providerAccount" type="text" value={formData.providerAccount ? `***${formData.providerAccount.slice(-4)}` : ''} 
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) handleInputChange({ target: { name: 'providerAccount', value: val }});
                        }} 
                        fullWidth size="small" sx={styles.customTextField}
                        inputProps={{ maxLength: 20, inputMode: 'numeric', pattern: '[0-9]*' }}
                        InputProps={{ readOnly: true }}
                    />
                </Box>

                {/* --- SECCIÓN 4: COMPRA --- */}
                <Typography sx={styles.sectionTitle}>Detalles de la Compra</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                    <TextField label="Dólares Comprados ($)" name="dollarsBought" type="number" value={formData.dollarsBought} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ min: 0, step: "any" }} />
                    <TextField label="Tasa (Bs.)" name="exchangeRate" type="number" value={formData.exchangeRate} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ min: 0, step: "any" }} />
                    <TextField label="Bolívares (Bs.)" name="bolivares" type="number" value={formData.bolivares} fullWidth size="small" sx={styles.customTextField} InputProps={{ readOnly: true }} />
                </Box>

                <TextField label="Observaciones" name="observations" multiline rows={4} value={formData.observations} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} />
            
            </DialogContent>
            
            <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                <Button onClick={handleLocalSave} variant="contained" sx={styles.darkButton}>Guardar Compra</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PurchaseModal;