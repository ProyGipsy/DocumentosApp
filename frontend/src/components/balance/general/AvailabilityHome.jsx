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
    Autocomplete 
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

// --- DATOS SIMULADOS (MOCKS) COMO RESPALDO ---
const mockTransactions = [];

const AvailabilityHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    
    // Inicializamos vacíos. Se llenarán en el useEffect con el Fetch o los Mocks.
    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortOrder, setSortOrder] = useState('desc');

    // --- ESTADOS DE DATOS DESDE EL BACKEND ---
    const [statusList, setStatusList] = useState([]);
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
        reference: '',
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

            // 1. Estados
            try {
                const statusRes = await fetch(`${apiUrl}/availability/getTransactionStatuses`, { method: 'GET', headers });
                if (statusRes.ok) setStatusList(await statusRes.json());
                else throw new Error("Fallback");
            } catch (e) {
                setStatusList([
                    { TransitStatusID: 1, StatusCode: 'PENDING', StatusName: 'Pendiente', IsFinal: false, SortOrder: 1 },
                    { TransitStatusID: 2, StatusCode: 'EXECUTED', StatusName: 'Ejecutada', IsFinal: true, SortOrder: 2 },
                    { TransitStatusID: 3, StatusCode: 'CANCELLED', StatusName: 'Anulada', IsFinal: true, SortOrder: 3 }
                ]);
            }

            // 2. Bancos
            try {
                const bankRes = await fetch(`${apiUrl}/availability/getBanks`, { method: 'GET', headers });
                if (bankRes.ok) setBankList(await bankRes.json());
                else throw new Error("Fallback");
            } catch (e) {
                setBankList([{ BankID: 1, BankName: 'Banesco' }, { BankID: 2, BankName: 'Mercantil' }, { BankID: 3, BankName: 'Provincial' }]);
            }

            // 3. Entidades
            try {
                const entityRes = await fetch(`${apiUrl}/availability/getEntities`, { method: 'GET', headers });
                if (entityRes.ok) setEntityList(await entityRes.json());
                else throw new Error("Fallback");
            } catch (e) {
                setEntityList([{ EntityID: 1, EntityName: 'Cliente A' }, { EntityID: 2, EntityName: 'Cliente B' }, { EntityID: 3, EntityName: 'Proveedor XYZ' }]);
            }

            // 4. Monedas
            try {
                const currencyRes = await fetch(`${apiUrl}/availability/getCurrencies`, { method: 'GET', headers });
                if (currencyRes.ok) setCurrencyList(await currencyRes.json());
                else throw new Error("Fallback");
            } catch (e) {
                setCurrencyList([
                    { CurrencyID: 1, CurrencyName: 'Bolívares', Symbol: 'VES' }, 
                    { CurrencyID: 2, CurrencyName: 'Dólares', Symbol: 'USD' }, 
                    { CurrencyID: 10, CurrencyName: 'Euros', Symbol: 'EUR' }
                ]);
            }

            // 5. Transacciones (Tabla Principal)
            try {
                const txRes = await fetch(`${apiUrl}/availability/getTransactions`, { method: 'GET', headers });
                if (txRes.ok) {
                    const data = await txRes.json();
                    setAllTransactions(data);
                } else {
                    throw new Error("Fallback");
                }
            } catch (e) {
                // Si falla el backend, cargamos los mocks para poder simular
                setAllTransactions(mockTransactions);
            }
        };

        fetchInitialData();
    }, []);

    // --- 2. CASCADA: BUSCAR CUENTAS CUANDO CAMBIA EL BANCO ---
    useEffect(() => {
        const fetchAccountsForBank = async () => {
            if (!formData.bank || bankList.length === 0) {
                setAccountList([]);
                return;
            }

            const selectedBank = bankList.find(b => b.BankName === formData.bank);
            if (!selectedBank) return;

            const token = sessionStorage.getItem('session_token');
            try {
                const res = await fetch(`${apiUrl}/availability/banks/${selectedBank.BankID}/accounts`, { 
                    method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    setAccountList(await res.json());
                } else {
                    throw new Error("Fallback");
                }
            } catch (error) {
                setAccountList([
                    { AccountID: 1, AccountNumber: `01${selectedBank.BankID}4-XXXX-XXXX-1111`, CurrencyID: 1 }, 
                    { AccountID: 2, AccountNumber: `01${selectedBank.BankID}4-YYYY-YYYY-2222`, CurrencyID: 2 }  
                ]);
            }
        };

        fetchAccountsForBank();
    }, [formData.bank, bankList]);

    // --- 3. FILTRO DE BÚSQUEDA ---
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
            trx.reference.toLowerCase().includes(lowerCaseSearch) ||
            trx.status.toLowerCase().includes(lowerCaseSearch)
        );
        setFilteredTransactions(results);
        setPage(0); 
    }, [searchTerm, allTransactions]);

    // --- 4. ORDENAMIENTO DE FECHAS ---
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const handleSortToggle = () => setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));

    // --- MANEJADORES DEL MODAL ---
    const handleOpenCreateModal = () => {
        setEditingId(null); 
        setFormData({
            date: new Date().toISOString().split('T')[0],
            entity: '', 
            bank: '', 
            account: '', 
            reference: '',
            concept: '',
            amount: '',
            status: 'Pendiente'
        });
        setOpenModal(true);
    };

    const handleOpenEditModal = (trx) => {
        setEditingId(trx.id); 
        setFormData({
            date: trx.date,
            entity: trx.entity || '',
            bank: trx.bank,
            account: trx.account || '',
            reference: trx.reference,
            concept: trx.concept, 
            amount: trx.amount,
            status: trx.status
        });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveTransaction = () => {
        if (!formData.entity || !formData.bank || !formData.account || !formData.amount || !formData.concept) {
            alert("Por favor llena todos los campos obligatorios.");
            return;
        }

        const amountVal = parseFloat(formData.amount) || 0;

        // Simulamos el guardado localmente (esto luego será un fetch POST)
        if (editingId) {
            setAllTransactions(prev => prev.map(trx => 
                trx.id === editingId ? { ...trx, ...formData, amount: amountVal } : trx
            ));
        } else {
            const newTransaction = {
                id: allTransactions.length > 0 ? Math.max(...allTransactions.map(t => t.id)) + 1 : 1,
                ...formData,
                amount: amountVal
            };
            setAllTransactions([newTransaction, ...allTransactions]);
            setSearchTerm('');
            setPage(0);
        }
        handleCloseModal();
    };

    const handleOpenCancelModal = (id) => { setCancelId(id); setOpenCancelModal(true); };
    const handleCloseCancelModal = () => { setOpenCancelModal(false); setCancelId(null); };

    const handleConfirmCancel = () => {
        // Simulamos la anulación localmente (esto luego será un fetch PUT/PATCH)
        setAllTransactions(prev => prev.map(trx => 
            trx.id === cancelId ? { ...trx, status: 'Anulada' } : trx 
        ));
        handleCloseCancelModal();
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusChip = (status) => {
        let color = 'default';
        if (status === 'Ejecutada') color = 'success';
        if (status === 'Pendiente') color = 'warning';
        if (status === 'Anulada') color = 'error'; 
        return <Chip label={status} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    };

    // --- LÓGICA DEL PLACEHOLDER DINÁMICO ---
    let amountPlaceholder = "Seleccione una cuenta primero...";
    
    if (formData.account && accountList.length > 0) {
        const selectedAcc = accountList.find(acc => acc.AccountNumber === formData.account);
        if (selectedAcc && selectedAcc.CurrencyID) {
            const matchedCurrency = currencyList.find(c => c.CurrencyID === selectedAcc.CurrencyID);
            if (matchedCurrency) {
                if (matchedCurrency.CurrencyID === 1) amountPlaceholder = "Ej: 1500,50 VES o -1500,50";
                else if (matchedCurrency.CurrencyID === 2) amountPlaceholder = "Ej: 100,00 USD o -100,00";
                else if (matchedCurrency.CurrencyID === 10) amountPlaceholder = "Ej: 100,00 EUR o -100,00";
                else amountPlaceholder = `Monto en ${matchedCurrency.Symbol || ''}`;
            }
        }
    }

    return (
        <LayoutBaseAdmin activePage="home">
            <Box className="home-admin-container-availability" sx={{ padding: '20px', margin: '0 auto' }}>
                <Box className="title-section-home-availability" sx={{ marginBottom: '20px' }}>
                    <Typography variant="h4" sx={{ color: '#262626', fontWeight: 'bold', mb: 1 }}>
                        Módulo de Disponibilidad Gipsy
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                        Bienvenido(a){user ? `, ${user.firstName}` : ''}
                    </Typography>
                </Box>

                <Box className="search-bar-container-availability" sx={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por concepto, entidad, banco, cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '10px 15px', borderRadius: '16px', border: '1px solid #ccc' }}
                    />
                </Box>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={darkButtonStyle} onClick={handleOpenCreateModal}>
                        Agregar Transacción
                    </Button>
                </Box>

                {/* --- TABLA --- */}
                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de disponibilidad">
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
                                        
                                        // Intentamos buscar el símbolo de la moneda si la data lo provee
                                        const trxCurrency = currencyList.find(c => c.CurrencyName === trx.currency);
                                        const symbol = trxCurrency ? trxCurrency.Symbol : '';

                                        return (
                                            <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                                <TableCell>{trx.date}</TableCell>
                                                <TableCell>{trx.entity}</TableCell>
                                                <TableCell>{trx.bank}</TableCell>
                                                <TableCell>{trx.account}</TableCell>
                                                <TableCell>{trx.reference}</TableCell>
                                                <TableCell>{trx.concept}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: trx.amount > 0 ? '#2e7d32' : '#d32f2f' }}>
                                                    {trx.amount > 0 ? '+' : ''}{trx.amount.toFixed(2)} {symbol}
                                                </TableCell>
                                                <TableCell align="center">{getStatusChip(trx.status)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton color="primary" onClick={() => handleOpenEditModal(trx)} sx={{ color: '#262626' }} title="Editar">
                                                        <EditIcon />
                                                    </IconButton>
                                                    {trx.status !== 'Anulada' && (
                                                        <IconButton color="error" onClick={() => handleOpenCancelModal(trx.id)} title="Anular Transacción">
                                                            <CancelIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}><Typography variant="body1" color="textSecondary">No se encontraron transacciones.</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredTransactions.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" />
                </Paper>

                {/* --- MODAL PARA AGREGAR / EDITAR TRANSACCIÓN --- */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                        {editingId ? 'Editar Transacción' : 'Nueva Transacción'}
                    </DialogTitle>
                    <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* Entidad y Referencia */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Autocomplete
                                options={entityList.map((option) => option.EntityName)}
                                value={formData.entity || null}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, entity: newValue || '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Entidad" placeholder="Cliente, Proveedor..." fullWidth size="small" sx={customTextFieldStyle} />
                                )}
                            />
                            <TextField label="Número de Referencia" name="reference" value={formData.reference} onChange={handleInputChange} fullWidth size="small" sx={customTextFieldStyle} />
                        </Box>

                        {/* Banco y Cuenta (La Cascada) */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Autocomplete
                                options={bankList.map((option) => option.BankName)}
                                value={formData.bank || null}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        bank: newValue || '', 
                                        account: '' // Vaciamos cuenta si cambia banco
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Entidad Bancaria" placeholder="Banco..." fullWidth size="small" sx={customTextFieldStyle} />
                                )}
                            />
                            
                            <Autocomplete
                                options={accountList.map((option) => option.AccountNumber)}
                                value={formData.account || null}
                                disabled={!formData.bank || accountList.length === 0} 
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, account: newValue || '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Cuenta Asociada" placeholder={!formData.bank ? "Seleccione banco" : "N° de Cuenta..."} fullWidth size="small" sx={customTextFieldStyle} />
                                )}
                            />
                        </Box>

                        {/* Fecha y Monto */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Fecha" name="date" type="date" value={formData.date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={customTextFieldStyle} />
                            
                            <TextField 
                                label="Monto" 
                                name="amount" 
                                type="number" 
                                placeholder={amountPlaceholder} 
                                value={formData.amount} 
                                onChange={handleInputChange} 
                                fullWidth 
                                size="small" 
                                sx={customTextFieldStyle} 
                                disabled={!formData.account} // <-- Bloqueo activo hasta que haya cuenta
                            />
                        </Box>

                        {/* Concepto (Ancho completo) */}
                        <TextField label="Concepto" name="concept" multiline rows={2} value={formData.concept} onChange={handleInputChange} fullWidth size="small" sx={customTextFieldStyle} />

                        {/* Estado (Ancho completo) */}
                        <FormControl fullWidth size="small" sx={customTextFieldStyle}>
                            <InputLabel id="status-select-label">Estado</InputLabel>
                            <Select labelId="status-select-label" name="status" value={formData.status} label="Estado" onChange={handleInputChange}>
                                {statusList.map((statusItem) => (
                                    <MenuItem key={statusItem.TransitStatusID} value={statusItem.StatusName}>
                                        {statusItem.StatusName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    </DialogContent>
                    <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                        <Button onClick={handleCloseModal} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                        <Button onClick={handleSaveTransaction} variant="contained" sx={darkButtonStyle}>Guardar</Button>
                    </DialogActions>
                </Dialog>

                {/* --- MODAL DE ADVERTENCIA PARA CANCELAR --- */}
                <Dialog open={openCancelModal} onClose={handleCloseCancelModal} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Anular Transacción</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">
                            ¿Estás seguro de que deseas anular esta transacción? Esta acción cambiará su estado a <strong>Anulada</strong>.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ padding: '16px' }}>
                        <Button onClick={handleCloseCancelModal} color="inherit" sx={{ fontWeight: 'bold' }}>Volver</Button>
                        <Button onClick={handleConfirmCancel} variant="contained" color="error" sx={{ fontWeight: 'bold', borderRadius: '16px', padding: '6px 16px' }}>
                            Sí, Anular
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </LayoutBaseAdmin>
    );
};

export default AvailabilityHome;