import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import '../../../styles/general/homeGeneral.css';
import { useAuth } from '../../../utils/AuthContext';

// Importaciones de Material UI
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    TablePagination,
    Chip,
    Typography,
    Button,
    Box,
    Dialog,           
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    TableSortLabel,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Backdrop,
    CircularProgress
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- ESTILOS REUTILIZABLES ---
const tableHeaderStyle = {
    backgroundColor: '#262626', 
    fontWeight: 'bold', 
    color: '#f4f4f4', 
    transition: 'background-color 0.3s ease', 
    '&:hover': { backgroundColor: '#595959', color: '#ffffff', cursor: 'pointer' }
};

const darkButtonStyle = {
    backgroundColor: '#262626', 
    color: '#f4f4f4', 
    fontWeight: 'bold', 
    borderRadius: '16px',
    padding: '10px 20px',
    boxShadow: 3,
    '&:hover': { backgroundColor: '#595959', color: '#ffffff' }
};

const customTextFieldStyle = {
    '& label.Mui-focused': { color: '#262626' },
    '& .MuiOutlinedInput-root': {
        '&.Mui-focused fieldset': { borderColor: '#262626' },
    },
};

const AvailabilityHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');

    // --- ESTADOS DE CARGA ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Cargando...');
    
    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortOrder, setSortOrder] = useState('desc');

    // --- ESTADOS DE DATOS DESDE EL BACKEND ---
    const [statusList, setStatusList] = useState([]);
    const [allBanksList, setAllBanksList] = useState([]); 
    const [bankList, setBankList] = useState([]); 
    const [accountList, setAccountList] = useState([]);
    const [entityList, setEntityList] = useState([]); 
    const [currencyList, setCurrencyList] = useState([]); 

    // --- ESTADOS PARA MODALES ---
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        entity: '', 
        bank: '', 
        account: '', 
        reference: '', // Se mantiene en el estado pero no hay input en el modal
        concept: '',
        amount: '',
        status: 'Pendiente'
    });

    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [cancelId, setCancelId] = useState(null);

    // --- 1. LLAMADA AL BACKEND PARA DATOS INICIALES ---
    useEffect(() => {
        const fetchInitialData = async () => {
            const token = sessionStorage.getItem('session_token');
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            setLoadingText('Cargando transacciones...')
            setIsLoading(true);
            
            try {
                const txRes = await fetch(`${apiUrl}/availability/getTransitTransactions`, { method: 'GET', headers });
                if (txRes.ok) {
                    const data = await txRes.json();
                    setAllTransactions(data);
                }
            } catch (e) {
                console.error("Error al cargar transacciones");
            } finally {
                setIsLoading(false);
            }

            // Carga de catálogos
            try {
                const [statusRes, bankRes, entityRes, currencyRes] = await Promise.all([
                    fetch(`${apiUrl}/availability/getTransactionStatuses`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/getBanks`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/getEntities`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/getCurrencies`, { method: 'GET', headers })
                ]);

                if (statusRes.ok) setStatusList(await statusRes.json());
                if (bankRes.ok) setAllBanksList(await bankRes.json());
                if (entityRes.ok) setEntityList(await entityRes.json());
                if (currencyRes.ok) setCurrencyList(await currencyRes.json());
            } catch (e) {
                console.error("Error al cargar catálogos");
            }
        };

        fetchInitialData();
    }, []);

    // --- 2. CASCADA 1: ENTIDAD -> BANCOS ---
    useEffect(() => {
        const fetchBanksForEntity = async () => {
            if (!formData.entity || entityList.length === 0) {
                setBankList([]);
                return;
            }
            const selectedEntity = entityList.find(e => e.EntityName === formData.entity);
            if (!selectedEntity) return;

            const token = sessionStorage.getItem('session_token');
            try {
                const res = await fetch(`${apiUrl}/availability/entities/${selectedEntity.EntityID}/banks`, { 
                    method: 'GET', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setBankList(await res.json());
            } catch (error) {
                setBankList(allBanksList);
            }
        };
        fetchBanksForEntity();
    }, [formData.entity, entityList, allBanksList]);

    // --- 3. CASCADA 2: BANCO -> CUENTAS ---
    useEffect(() => {
        const fetchAccountsForBankAndEntity = async () => {
            if (!formData.bank || bankList.length === 0 || !formData.entity || entityList.length === 0) {
                setAccountList([]);
                return;
            }
            const selectedBank = bankList.find(b => b.BankName === formData.bank);
            const selectedEntity = entityList.find(e => e.EntityName === formData.entity); 

            if (!selectedBank || !selectedEntity) return;

            const token = sessionStorage.getItem('session_token');
            try {
                const fetchUrl = `${apiUrl}/availability/banks/${selectedBank.BankID}/accounts?entity_id=${selectedEntity.EntityID}`;
                const res = await fetch(fetchUrl, { 
                    method: 'GET', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setAccountList(await res.json());
            } catch (error) {
                setAccountList([]);
            }
        };
        fetchAccountsForBankAndEntity();
    }, [formData.bank, formData.entity, bankList, entityList]); 

    // --- 4. FILTRO Y ORDENAMIENTO ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTransactions(allTransactions);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allTransactions.filter(trx =>
            trx.concept.toLowerCase().includes(lowerCaseSearch) ||
            (trx.entity && trx.entity.toLowerCase().includes(lowerCaseSearch)) ||
            trx.bank.toLowerCase().includes(lowerCaseSearch) ||
            (trx.account && trx.account.toLowerCase().includes(lowerCaseSearch)) ||
            trx.status.toLowerCase().includes(lowerCaseSearch)
        );
        setFilteredTransactions(results);
        setPage(0); 
    }, [searchTerm, allTransactions]);

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const handleSortToggle = () => setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));

    const formatDateToYYMMDD = (dateString) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString; 
            const year = d.getFullYear().toString().substring(2); 
            const month = String(d.getMonth() + 1).padStart(2, '0'); 
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) { return dateString; }
    };

    // --- MANEJADORES DE MODAL ---
    const handleOpenCreateModal = () => {
        setEditingId(null); 
        setFormData({
            date: new Date().toISOString().split('T')[0],
            entity: '', bank: '', account: '', reference: '',
            concept: '', amount: '', status: 'Pendiente'
        });
        setOpenModal(true);
    };

    const handleOpenEditModal = (trx) => {
        setEditingId(trx.id); 
        let formattedDate = '';
        try { formattedDate = new Date(trx.date).toISOString().split('T')[0]; } 
        catch (e) { formattedDate = new Date().toISOString().split('T')[0]; }

        setFormData({
            date: formattedDate, 
            entity: trx.entity || '',
            bank: trx.bank,
            account: trx.account || '',
            reference: trx.reference || '', // Mantenemos la referencia de la BD
            concept: trx.concept, 
            amount: trx.amount,
            status: trx.status
        });
        setOpenModal(true);
    };

    const handleCloseModal = () => { setOpenModal(false); setEditingId(null); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveTransaction = async () => {
        if (!formData.entity || !formData.bank || !formData.account || !formData.amount || !formData.concept) {
            alert("Por favor llena todos los campos obligatorios.");
            return;
        }

        const selectedEntity = entityList.find(e => e.EntityName === formData.entity);
        const selectedBank = bankList.find(b => b.BankName === formData.bank);
        const selectedAccount = accountList.find(a => a.AccountNumber === formData.account);
        const selectedStatus = statusList.find(s => s.StatusName === formData.status);

        if (!selectedEntity || !selectedBank || !selectedAccount || !selectedStatus) {
            alert("Datos seleccionados inválidos.");
            return;
        }

        const payload = {
            DateTrx: formData.date,
            EntityID: selectedEntity.EntityID,
            BankID: selectedBank.BankID,
            AccountID: selectedAccount.AccountID,
            ReferenceDoc: formData.reference, // Enviamos lo que está en el estado (manual o de la BD)
            Concept: formData.concept,
            Amount: parseFloat(formData.amount),
            TransitStatusID: selectedStatus.TransitStatusID
        };

        const token = sessionStorage.getItem('session_token');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        setLoadingText('Procesando solicitud...')
        setIsLoading(true);

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${apiUrl}/availability/transactions/${editingId}` : `${apiUrl}/availability/transactions`;
            
            const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

            if (response.ok) {
                const data = await response.json();
                if (editingId) {
                    setAllTransactions(prev => prev.map(trx => trx.id === editingId ? { ...trx, ...formData, amount: payload.Amount } : trx));
                } else {
                    const newTransaction = { ...formData, id: data.new_id, amount: payload.Amount };
                    setAllTransactions([newTransaction, ...allTransactions]);
                }
                handleCloseModal();
            }
        } catch (error) {
            alert("Error de conexión.");
        } finally { setIsLoading(false); }
    };

    const handleOpenCancelModal = (id) => { setCancelId(id); setOpenCancelModal(true); };
    const handleCloseCancelModal = () => { setOpenCancelModal(false); setCancelId(null); };

    const handleConfirmCancel = async () => {
        const trxToCancel = allTransactions.find(t => t.id === cancelId);
        if (!trxToCancel) return;

        const selectedEntity = entityList.find(e => e.EntityName === trxToCancel.entity);
        const selectedBank = allBanksList.find(b => b.BankName === trxToCancel.bank);
        const selectedStatus = statusList.find(s => s.StatusName === 'Anulada');

        if (!selectedEntity || !selectedBank || !selectedStatus) return;

        const token = sessionStorage.getItem('session_token');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        setIsLoading(true);
        setLoadingText('Anulando...');

        try {
            const accRes = await fetch(`${apiUrl}/availability/banks/${selectedBank.BankID}/accounts?entity_id=${selectedEntity.EntityID}`, { method: 'GET', headers });
            const accounts = await accRes.json();
            const acc = accounts.find(a => a.AccountNumber === trxToCancel.account);
            
            const payload = {
                DateTrx: new Date(trxToCancel.date).toISOString().split('T')[0],
                EntityID: selectedEntity.EntityID,
                BankID: selectedBank.BankID,
                AccountID: acc.AccountID,
                ReferenceDoc: trxToCancel.reference,
                Concept: trxToCancel.concept,
                Amount: parseFloat(trxToCancel.amount),
                TransitStatusID: selectedStatus.TransitStatusID
            };

            const response = await fetch(`${apiUrl}/availability/transactions/${cancelId}`, {
                method: 'PUT', headers, body: JSON.stringify(payload)
            });

            if (response.ok) {
                setAllTransactions(prev => prev.map(trx => trx.id === cancelId ? { ...trx, status: 'Anulada' } : trx));
                handleCloseCancelModal();
            }
        } catch (e) { alert("Error al anular."); } finally { setIsLoading(false); }
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

    const getStatusChip = (status) => {
        let color = status === 'Ejecutada' ? 'success' : status === 'Pendiente' ? 'warning' : 'error';
        return <Chip label={status} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    };

    let amountPlaceholder = formData.account ? "Ingrese monto..." : "Seleccione una cuenta primero...";

    return (
        <LayoutBaseAdmin activePage="home">
            <Box className="home-admin-container-availability" sx={{ padding: '20px', margin: '0 auto' }}>
                <Box sx={{ marginBottom: '20px' }}>
                    <Typography variant="h4" sx={{ color: '#262626', fontWeight: 'bold', mb: 1 }}>Módulo de Disponibilidad Gipsy</Typography>
                    <Typography variant="h6" color="textSecondary">Bienvenido(a){user ? `, ${user.firstName}` : ''}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por concepto, entidad, banco, cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '10px 15px', borderRadius: '16px', border: '1px solid #ccc' }}
                    />
                </Box>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={darkButtonStyle} onClick={handleOpenCreateModal}>Agregar Transacción</Button>
                </Box>

                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={tableHeaderStyle}>
                                        <TableSortLabel active={true} direction={sortOrder} onClick={handleSortToggle} sx={{ color: '#f4f4f4 !important', '& .MuiTableSortLabel-icon': { color: '#f4f4f4 !important' } }}>Fecha</TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={tableHeaderStyle}>Entidad</TableCell>
                                    <TableCell sx={tableHeaderStyle}>Banco</TableCell>
                                    <TableCell sx={tableHeaderStyle}>Cuenta</TableCell>
                                    <TableCell sx={tableHeaderStyle}>Referencia</TableCell>
                                    <TableCell sx={tableHeaderStyle}>Concepto</TableCell>
                                    <TableCell align='center' sx={tableHeaderStyle}>Monto</TableCell>
                                    <TableCell align='center' sx={tableHeaderStyle}>Estado</TableCell>
                                    <TableCell align='center' sx={tableHeaderStyle}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => {
                                        const isFinalStatus = trx.status === 'Ejecutada' || trx.status === 'Anulada';
                                        return (
                                            <TableRow hover key={trx.id}>
                                                <TableCell>{formatDateToYYMMDD(trx.date)}</TableCell>
                                                <TableCell>{trx.entity}</TableCell>
                                                <TableCell>{trx.bank}</TableCell>
                                                <TableCell>{trx.account}</TableCell>
                                                <TableCell>{trx.reference}</TableCell>
                                                <TableCell>{trx.concept}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(trx.amount).toFixed(2)}</TableCell>
                                                <TableCell align="center">{getStatusChip(trx.status)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton color="primary" onClick={() => handleOpenEditModal(trx)} disabled={isFinalStatus} sx={{ color: isFinalStatus ? 'text.disabled' : '#262626' }}><EditIcon /></IconButton>
                                                    <IconButton color="error" onClick={() => handleOpenCancelModal(trx.id)} disabled={isFinalStatus}><CancelIcon /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={9} align="center">No se encontraron transacciones.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredTransactions.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
                </Paper>

                {/* MODAL PRINCIPAL */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4' }}>
                        {editingId ? 'Editar Transacción' : 'Nueva Transacción'}
                    </DialogTitle>
                    <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        
                        {/* Entidad sola en una fila (Referencia eliminada) */}
                        <Autocomplete
                            options={entityList.map((option) => option.EntityName)}
                            value={formData.entity || null}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({ ...prev, entity: newValue || '', bank: '', account: '' }));
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Entidad" fullWidth size="small" sx={customTextFieldStyle} />
                            )}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Autocomplete
                                options={bankList.map((option) => option.BankName)}
                                value={formData.bank || null}
                                disabled={!formData.entity}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, bank: newValue || '', account: '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Entidad Bancaria" placeholder={!formData.entity ? "Seleccione entidad primero" : "Banco..."} fullWidth size="small" sx={customTextFieldStyle} />
                                )}
                            />
                            <Autocomplete
                                options={accountList.map((option) => option.AccountNumber)}
                                value={formData.account || null}
                                disabled={!formData.bank || accountList.length === 0} 
                                onChange={(event, newValue) => { setFormData(prev => ({ ...prev, account: newValue || '' })); }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Cuenta Asociada" fullWidth size="small" sx={customTextFieldStyle} />
                                )}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Fecha" name="date" type="date" value={formData.date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={customTextFieldStyle} />
                            <TextField 
                                label="Monto" name="amount" type="number" placeholder={amountPlaceholder} value={formData.amount} 
                                onChange={handleInputChange} fullWidth size="small" sx={customTextFieldStyle} disabled={!formData.account}
                                inputProps={{ min: 0, step: "any" }}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                            />
                        </Box>

                        <TextField label="Concepto" name="concept" multiline rows={2} value={formData.concept} onChange={handleInputChange} fullWidth size="small" sx={customTextFieldStyle} />

                        <FormControl fullWidth size="small" sx={customTextFieldStyle}>
                            <InputLabel>Estado</InputLabel>
                            <Select name="status" value={formData.status} label="Estado" onChange={handleInputChange}>
                                {statusList.map((statusItem) => (
                                    <MenuItem key={statusItem.TransitStatusID} value={statusItem.StatusName}>{statusItem.StatusName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    </DialogContent>
                    <DialogActions sx={{ padding: '16px' }}>
                        <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
                        <Button onClick={handleSaveTransaction} variant="contained" sx={darkButtonStyle}>Guardar</Button>
                    </DialogActions>
                </Dialog>

                {/* MODAL DE ANULACIÓN */}
                <Dialog open={openCancelModal} onClose={handleCloseCancelModal} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Anular Transacción</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">¿Estás seguro de anular esta transacción? El estado cambiará a <strong>Anulada</strong>.</Typography>
                    </DialogContent>
                    <DialogActions sx={{ padding: '16px' }}>
                        <Button onClick={handleCloseCancelModal} color="inherit">Volver</Button>
                        <Button onClick={handleConfirmCancel} variant="contained" color="error" sx={{ borderRadius: '16px' }}>Sí, Anular</Button>
                    </DialogActions>
                </Dialog>

                <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(5px)' }} open={isLoading}>
                    <CircularProgress color="inherit" size={60} thickness={4} />
                    <Typography variant="h6" sx={{ ml: 2 }}>{loadingText}</Typography>
                </Backdrop>
            </Box>
        </LayoutBaseAdmin>
    );
};

export default AvailabilityHome;