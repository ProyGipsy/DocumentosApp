import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAvailability from '../base/LayoutBaseAvailability';
import { useAuth } from '../../../utils/AuthContext';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Chip, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, IconButton, FormControl, InputLabel, Select, MenuItem,
    Autocomplete, Backdrop, CircularProgress, InputBase
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- DICCIONARIO DE ESTILOS UNIFICADO (CSS + MUI) ---
const styles = {
    // Contenedor principal
    container: {
        padding: '30px',
        backgroundColor: 'rgb(240, 240, 240)',
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    // Sección del título
    titleSection: {
        width: '100%',
        maxWidth: '1200px',
        textAlign: 'center',
        marginBottom: '10px',
    },
    titleH2: {
        color: '#262626',
        marginBottom: '5px',
        fontWeight: 600,
    },
    titleH3: {
        color: '#262626',
        marginTop: 0,
        fontWeight: 500,
        fontSize: '1.2em',
    },
    // Barra de búsqueda
    searchContainer: {
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '90%',
        maxWidth: '500px',
        marginBottom: '50px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#f9f9f9',
        border: '1px solid #cccccc00',
        transition: 'background-color 0.3s',
        '&:focus-within': {
            backgroundColor: '#fff',
        }
    },
    searchInput: {
        ml: 1,
        flex: 1,
        padding: '8px 10px',
        color: '#191c16',
        '& input::placeholder': {
            color: '#888888',
            opacity: 1,
        }
    },
    searchButton: {
        p: '10px',
        backgroundColor: '#262626',
        color: 'white',
        borderRadius: '0 8px 8px 0',
        width: '55px',
        height: '100%',
        '&:hover': {
            backgroundColor: '#595959',
        }
    },
    // Estilos de la Tabla y Botones Generales
    tableHeader: {
        backgroundColor: '#262626', 
        fontWeight: 'bold', 
        color: '#f4f4f4', 
        transition: 'background-color 0.3s ease', 
        '&:hover': { backgroundColor: '#595959', color: '#ffffff', cursor: 'pointer' }
    },
    darkButton: {
        backgroundColor: '#262626', 
        color: '#f4f4f4', 
        fontWeight: 'bold', 
        borderRadius: '16px',
        padding: '10px 20px',
        boxShadow: 3,
        '&:hover': { backgroundColor: '#595959', color: '#ffffff' }
    },
    customTextField: {
        '& label.Mui-focused': { color: '#262626' },
        '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': { borderColor: '#262626' },
        },
    }
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

    // --- FUNCIONES AUXILIARES ---
    const formatDateToDDMMYYYY = (dateString) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString; 
            const day = String(d.getUTCDate()).padStart(2, '0'); 
            const month = String(d.getUTCMonth() + 1).padStart(2, '0'); 
            const year = d.getUTCFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
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
            reference: trx.reference || '',
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

    const handleSaveTransaction = async () => {
        if (!formData.entity || !formData.bank || !formData.account || !formData.amount || !formData.concept) {
            alert("Por favor llena todos los campos obligatorios.");
            return;
        }

        const amountVal = parseFloat(formData.amount);
        if (isNaN(amountVal) || amountVal === 0) {
            alert("Por favor ingresa un monto válido diferente de cero.");
            return;
        }

        const selectedEntity = entityList.find(e => e.EntityName === formData.entity);
        const selectedBank = bankList.find(b => b.BankName === formData.bank);
        const selectedAccount = accountList.find(a => a.AccountNumber === formData.account);
        const selectedStatus = statusList.find(s => s.StatusName === formData.status);

        if (!selectedEntity || !selectedBank || !selectedAccount || !selectedStatus) {
            alert("Error: Datos seleccionados inválidos. Por favor, selecciona opciones de las listas.");
            return;
        }

        const payload = {
            DateTrx: formData.date,
            EntityID: selectedEntity.EntityID,
            BankID: selectedBank.BankID,
            AccountID: selectedAccount.AccountID,
            ReferenceDoc: formData.reference,
            Concept: formData.concept,
            Amount: amountVal,
            TransitStatusID: selectedStatus.TransitStatusID
        };

        const token = sessionStorage.getItem('session_token');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        setLoadingText('Estamos procesando su solicitud. Por favor, espere.')
        setIsLoading(true);

        try {
            if (editingId) {
                const response = await fetch(`${apiUrl}/availability/transactions/${editingId}`, {
                    method: 'PUT', headers, body: JSON.stringify(payload)
                });

                if (response.ok) {
                    setAllTransactions(prev => prev.map(trx => 
                        trx.id === editingId ? { 
                            ...trx, date: formData.date, entity: formData.entity,
                            bank: formData.bank, account: formData.account,
                            reference: formData.reference, concept: formData.concept,
                            amount: amountVal, status: formData.status
                        } : trx
                    ));
                    handleCloseModal();
                } else {
                    const errorData = await response.json();
                    alert(`Error al editar la transacción: ${errorData.error || 'Desconocido'}`);
                }

            } else {
                const response = await fetch(`${apiUrl}/availability/transactions`, {
                    method: 'POST', headers, body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    const newTransaction = {
                        id: data.new_id || Math.max(0, ...allTransactions.map(t => t.id)) + 1, 
                        date: formData.date, entity: formData.entity, bank: formData.bank,
                        account: formData.account, reference: formData.reference,
                        concept: formData.concept, amount: amountVal, status: formData.status
                    };
                    
                    setAllTransactions([newTransaction, ...allTransactions]);
                    setSearchTerm('');
                    setPage(0);
                    handleCloseModal();
                } else {
                    const errorData = await response.json();
                    alert(`Error al crear la transacción: ${errorData.error || 'Desconocido'}`);
                }
            }
        } catch (error) {
            console.error("Error de red al guardar la transacción:", error);
            alert("Error de conexión con el servidor. Por favor, intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCancelModal = (id) => { setCancelId(id); setOpenCancelModal(true); };
    const handleCloseCancelModal = () => { setOpenCancelModal(false); setCancelId(null); };

    const handleConfirmCancel = async () => {
        const trxToCancel = allTransactions.find(t => t.id === cancelId);
        if (!trxToCancel) return;

        const selectedEntity = entityList.find(e => e.EntityName === trxToCancel.entity);
        const selectedBank = allBanksList.find(b => b.BankName === trxToCancel.bank);
        const selectedStatus = statusList.find(s => s.StatusName === 'Anulada');

        if (!selectedEntity || !selectedBank || !selectedStatus) {
            alert("Error: No se pudieron validar los datos base de la transacción para anularla.");
            return;
        }

        const token = sessionStorage.getItem('session_token');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        setLoadingText('Por favor, espere')
        setIsLoading(true);

        let resolvedAccountId = null;
        try {
            const fetchUrl = `${apiUrl}/availability/banks/${selectedBank.BankID}/accounts?entity_id=${selectedEntity.EntityID}`;
            const res = await fetch(fetchUrl, { method: 'GET', headers });
            
            if (res.ok) {
                const accounts = await res.json();
                const acc = accounts.find(a => a.AccountNumber === trxToCancel.account);
                if (acc) resolvedAccountId = acc.AccountID;
            } else {
                throw new Error("Fallo al obtener cuentas del servidor");
            }
        } catch (error) {
            resolvedAccountId = trxToCancel.account.includes('1111') ? 1 : 2;
        } 

        if (!resolvedAccountId) {
            setIsLoading(false);
            alert("Error: No se encontró la cuenta bancaria asociada en la base de datos.");
            return;
        }

        let formattedDate = '';
        try { formattedDate = new Date(trxToCancel.date).toISOString().split('T')[0]; } 
        catch (error) { formattedDate = new Date().toISOString().split('T')[0]; }

        const payload = {
            DateTrx: formattedDate, EntityID: selectedEntity.EntityID, BankID: selectedBank.BankID,
            AccountID: resolvedAccountId, ReferenceDoc: trxToCancel.reference,
            Concept: trxToCancel.concept, Amount: parseFloat(trxToCancel.amount),
            TransitStatusID: selectedStatus.TransitStatusID
        };

        setLoadingText('Estamos procesando su solicitud. Por favor, espere.')

        try {
            const response = await fetch(`${apiUrl}/availability/transactions/${cancelId}`, {
                method: 'PUT', headers, body: JSON.stringify(payload)
            });

            if (response.ok) {
                setAllTransactions(prev => prev.map(trx => 
                    trx.id === cancelId ? { ...trx, status: 'Anulada' } : trx 
                ));
                handleCloseCancelModal();
            } else {
                const errorData = await response.json();
                alert(`Error al anular la transacción: ${errorData.error || 'Desconocido'}`);
            }
        } catch (error) {
            console.error("Error de red al anular:", error);
            alert("Error de conexión con el servidor. Por favor, intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
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

    let amountPlaceholder = "Seleccione una cuenta primero...";
    
    if (formData.account && accountList.length > 0) {
        const selectedAcc = accountList.find(acc => acc.AccountNumber === formData.account);
        if (selectedAcc && selectedAcc.CurrencyID) {
            const matchedCurrency = currencyList.find(c => c.CurrencyID === selectedAcc.CurrencyID);
            if (matchedCurrency) {
                if (matchedCurrency.CurrencyID === 1) amountPlaceholder = "Ej: 1500,50 VES";
                else if (matchedCurrency.CurrencyID === 2) amountPlaceholder = "Ej: 100,00 USD";
                else if (matchedCurrency.CurrencyID === 10) amountPlaceholder = "Ej: 100,00 EUR";
                else amountPlaceholder = `Monto en ${matchedCurrency.Symbol || ''}`;
            }
        }
    }

    return (
        <LayoutBaseAvailability activePage="home">
            <Box sx={styles.container}>
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>
                        Módulo de Disponibilidad Gipsy
                    </Typography>
                    <Typography variant="h6" sx={styles.titleH3}>
                        Bienvenido(a){user ? `, ${user.firstName}` : ''}
                    </Typography>
                </Box>

                {/* --- BARRA DE BÚSQUEDA TIPO MATERIAL UI COMPUESTA --- */}
                <Paper component="form" sx={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={styles.searchInput}
                        placeholder="Buscar por concepto, entidad, banco, cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputProps={{ 'aria-label': 'buscar transacciones' }}
                    />
                </Paper>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={styles.darkButton} onClick={handleOpenCreateModal}>
                        Agregar Transacción
                    </Button>
                </Box>

                {/* --- TABLA --- */}
                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de disponibilidad">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>
                                        <TableSortLabel active={true} direction={sortOrder} onClick={handleSortToggle} sx={{ color: '#f4f4f4 !important', '& .MuiTableSortLabel-icon': { color: '#f4f4f4 !important' } }}>Fecha</TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={styles.tableHeader}>Entidad</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco</TableCell>
                                    <TableCell sx={styles.tableHeader}>Cuenta</TableCell>
                                    <TableCell sx={styles.tableHeader}>Referencia</TableCell>
                                    <TableCell sx={styles.tableHeader}>Concepto</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Monto</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Estado</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => {
                                        const trxCurrency = currencyList.find(c => c.CurrencyName === trx.currency);
                                        const symbol = trxCurrency ? trxCurrency.Symbol : '';
                                        const isFinalStatus = trx.status === 'Ejecutada' || trx.status === 'Anulada';

                                        return (
                                            <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                                <TableCell>{formatDateToDDMMYYYY(trx.date)}</TableCell>
                                                <TableCell>{trx.entity}</TableCell>
                                                <TableCell>{trx.bank}</TableCell>
                                                <TableCell>{trx.account}</TableCell>
                                                <TableCell>{trx.reference}</TableCell>
                                                <TableCell>{trx.concept}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {Number(trx.amount).toFixed(2)} {symbol}
                                                </TableCell>
                                                <TableCell align="center">{getStatusChip(trx.status)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton 
                                                        color="primary" 
                                                        onClick={() => handleOpenEditModal(trx)} 
                                                        disabled={isFinalStatus}
                                                        sx={{ color: isFinalStatus ? 'text.disabled' : '#262626' }} 
                                                        title={isFinalStatus ? "Edición bloqueada" : "Editar"}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton 
                                                        color="error" 
                                                        onClick={() => handleOpenCancelModal(trx.id)} 
                                                        disabled={isFinalStatus}
                                                        title={isFinalStatus ? "Anulación bloqueada" : "Anular Transacción"}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
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
                        <Autocomplete
                            options={entityList.map((option) => option.EntityName)}
                            value={formData.entity || null}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({ ...prev, entity: newValue || '', bank: '', account: '' }));
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Entidad" fullWidth size="small" sx={styles.customTextField} />
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
                                    <TextField {...params} label="Entidad Bancaria" placeholder={!formData.entity ? "Seleccione una entidad primero" : "Banco..."} fullWidth size="small" sx={styles.customTextField} />
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
                                    <TextField {...params} label="Cuenta Asociada" placeholder={!formData.bank ? "Seleccione banco" : "N° de Cuenta..."} fullWidth size="small" sx={styles.customTextField} />
                                )}
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Fecha" name="date" type="date" value={formData.date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={styles.customTextField} />
                            <TextField 
                                label="Monto" name="amount" type="number" placeholder={amountPlaceholder} value={formData.amount} 
                                onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} disabled={!formData.account}
                                inputProps={{ min: 0, step: "any" }} 
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                                }}
                            />
                        </Box>
                        <TextField label="Concepto" name="concept" multiline rows={2} value={formData.concept} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} />
                        <FormControl fullWidth size="small" sx={styles.customTextField}>
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
                        <Button onClick={handleSaveTransaction} variant="contained" sx={styles.darkButton}>Guardar</Button>
                    </DialogActions>
                </Dialog>

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

                {/* --- PANTALLA DE CARGA (BLUR) --- */}
                <Backdrop
                    sx={{
                        color: '#fff',
                        zIndex: (theme) => theme.zIndex.drawer + 999, 
                        backdropFilter: 'blur(5px)', 
                        backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}
                    open={isLoading}
                >
                    <CircularProgress color="inherit" size={60} thickness={4} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                        {loadingText}
                    </Typography>
                </Backdrop>
            </Box>
        </LayoutBaseAvailability>
    );
};

export default AvailabilityHome;