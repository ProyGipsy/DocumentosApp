import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBasePurchases from '../base/LayoutBasePurchases';
import { useAuth } from '../../../utils/AuthContext';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, IconButton, Autocomplete, InputBase, Backdrop, CircularProgress
} from '@mui/material';

// Iconos
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

// --- CONFIGURACIÓN DE API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- DICCIONARIO DE ESTILOS UNIFICADO (CSS + MUI) ---
const styles = {
    container: { padding: '30px', backgroundColor: 'rgb(240, 240, 240)', minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    titleSection: { width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '10px' },
    titleH2: { color: '#191c16', marginBottom: '5px', fontWeight: 600 },
    titleH3: { color: '#61608b', marginTop: 0, fontWeight: 500, fontSize: '1.2em' },
    searchContainer: { p: '2px 4px', display: 'flex', alignItems: 'center', width: '90%', maxWidth: '500px', marginBottom: '50px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)', backgroundColor: '#f9f9f9', border: '1px solid #cccccc00', transition: 'background-color 0.3s', '&:focus-within': { backgroundColor: '#fff' } },
    searchInput: { ml: 1, flex: 1, padding: '8px 10px', color: '#191c16', '& input::placeholder': { color: '#888888', opacity: 1 } },
    searchButton: { p: '10px', backgroundColor: '#6d36ce', color: 'white', borderRadius: '0 8px 8px 0', width: '55px', height: '100%', '&:hover': { backgroundColor: '#975cfc' } },
    tableHeader: { backgroundColor: '#6d36ce', fontWeight: 'bold', color: '#f4f4f4', transition: 'background-color 0.3s ease', '&:hover': { backgroundColor: '#975cfc', color: '#ffffff', cursor: 'pointer' } },
    darkButton: { backgroundColor: '#6d36ce', color: '#f4f4f4', fontWeight: 'bold', borderRadius: '16px', padding: '10px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' } },
    customTextField: { '& label.Mui-focused': { color: '#6d36ce' }, '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#975cfc' } } }
};

const PurchasesHome = () => {
    const { user } = useAuth();
    
    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    
    // --- ESTADOS DE CATÁLOGOS (Desde el backend) ---
    const [companiesList, setCompaniesList] = useState([]);
    const [banksList, setBanksList] = useState([]);

    // Paginación, Orden y Carga
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortOrder, setSortOrder] = useState('desc');
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS PARA MODALES ---
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        company: '', entityId: '', bank: '', bankId: '', account: '', dollarsBought: '', exchangeRate: '', bolivares: '', observations: ''
    });

    // --- 1. LLAMADA AL BACKEND: OBTENER DATOS INICIALES ---
    const fetchInitialData = async () => {
        const token = sessionStorage.getItem('session_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        setIsLoading(true);
        try {
            const [trxRes, entitiesRes, banksRes] = await Promise.all([
                fetch(`${apiUrl}/purchases/getPurchases`, { method: 'GET', headers }),
                fetch(`${apiUrl}/purchases/getBeneficiaries`, { method: 'GET', headers }),
                fetch(`${apiUrl}/availability/getBanks`, { method: 'GET', headers })
            ]);

            if (trxRes.ok) setAllTransactions(await trxRes.json());
            if (entitiesRes.ok) setCompaniesList(await entitiesRes.json());
            if (banksRes.ok) setBanksList(await banksRes.json());
            
        } catch (error) {
            console.error("Error al cargar la data inicial:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInitialData();
    }, [user]);

    // --- FILTRO Y ORDENAMIENTO ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTransactions(allTransactions);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allTransactions.filter(trx =>
            (trx.company && trx.company.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.bank && trx.bank.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.account && trx.account.includes(lowerCaseSearch)) ||
            (trx.observations && trx.observations.toLowerCase().includes(lowerCaseSearch))
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
            const parts = dateString.split('-');
            if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateString;
        } catch (error) { return dateString; }
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // --- MANEJADORES DE MODAL ---
    const handleOpenCreateModal = () => {
        setEditingId(null); 
        setFormData({
            date: new Date().toISOString().split('T')[0],
            company: '', entityId: '', bank: '', bankId: '', account: '', dollarsBought: '', exchangeRate: '', bolivares: '', observations: ''
        });
        setOpenModal(true);
    };

    const handleOpenEditModal = (trx) => {
        const selectedCompany = companiesList.find(c => c.name === trx.company);
        const selectedBank = banksList.find(b => b.BankName === trx.bank);

        setEditingId(trx.id); 
        setFormData({
            date: trx.date, 
            company: trx.company, 
            entityId: selectedCompany ? selectedCompany.id : '',
            bank: trx.bank, 
            bankId: selectedBank ? selectedBank.BankID : '',
            account: trx.account,
            dollarsBought: trx.dollarsBought, 
            exchangeRate: trx.exchangeRate,
            bolivares: trx.bolivares, 
            observations: trx.observations || ''
        });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingId(null);
    };

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

    // --- CONEXIÓN CON POST Y PUT DEL BACKEND ---
    const handleSaveTransaction = async () => {
        if (!formData.entityId || !formData.bankId || !formData.account || !formData.dollarsBought || !formData.exchangeRate || !formData.bolivares) {
            alert("Por favor llena todos los campos numéricos y de selección.");
            return;
        }

        if (formData.account.length !== 20) {
            alert("El número de cuenta debe tener exactamente 20 dígitos.");
            return;
        }

        const token = sessionStorage.getItem('session_token');
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId 
            ? `${apiUrl}/purchases/updatePurchase/${editingId}` 
            : `${apiUrl}/purchases/addPurchase`;

        setIsLoading(true);
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchInitialData();
                handleCloseModal();
            } else {
                const error = await response.json();
                alert(`Error al guardar: ${error.error}`);
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <LayoutBasePurchases activePage="home">
            <Box sx={styles.container}>
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>Registro de Compra de Dólares</Typography>
                    <Typography variant="h6" sx={styles.titleH3}>Bienvenido(a){user ? `, ${user.firstName}` : ''}</Typography>
                </Box>

                <Paper component="form" sx={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={styles.searchInput}
                        placeholder="Buscar por empresa, banco, cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputProps={{ 'aria-label': 'buscar compras' }}
                    />
                    <IconButton type="button" sx={styles.searchButton} aria-label="search"><SearchIcon /></IconButton>
                </Paper>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={styles.darkButton} onClick={handleOpenCreateModal}>
                        Registrar Compra
                    </Button>
                </Box>

                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de compras de dolares">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>
                                        <TableSortLabel active={true} direction={sortOrder} onClick={handleSortToggle} sx={{ color: '#f4f4f4 !important', '& .MuiTableSortLabel-icon': { color: '#f4f4f4 !important' } }}>
                                            Fecha
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={styles.tableHeader}>Empresa</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco Pagador</TableCell>
                                    <TableCell align='right' sx={styles.tableHeader}>Dólares Comprados</TableCell>
                                    <TableCell align='right' sx={styles.tableHeader}>Tasa</TableCell>
                                    <TableCell align='right' sx={styles.tableHeader}>Bolívares</TableCell>
                                    <TableCell sx={styles.tableHeader}>Observaciones</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                            <TableCell>{formatDateToDDMMYYYY(trx.date)}</TableCell>
                                            <TableCell>{trx.company}</TableCell>
                                            <TableCell>{trx.bank}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>${formatCurrency(trx.dollarsBought)}</TableCell>
                                            <TableCell align="right">Bs. {formatCurrency(trx.exchangeRate)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Bs. {formatCurrency(trx.bolivares)}</TableCell>
                                            <TableCell>{trx.observations}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => handleOpenEditModal(trx)} title="Editar">
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">No se encontraron registros.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredTransactions.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" />
                </Paper>

                {/* --- MODAL --- */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                        {editingId ? 'Editar Compra' : 'Registrar Nueva Compra'}
                    </DialogTitle>
                    <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                            <TextField label="Fecha" name="date" type="date" value={formData.date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth size="small" sx={styles.customTextField} />
                            <Autocomplete
                                options={companiesList.map(c => c.name)}
                                value={formData.company || null}
                                onChange={(event, newValue) => {
                                    const selectedCompany = companiesList.find(c => c.name === newValue);
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        company: newValue || '', 
                                        entityId: selectedCompany ? selectedCompany.id : '',
                                        bank: selectedCompany ? selectedCompany.bank : prev.bank,
                                        bankId: selectedCompany ? selectedCompany.bankId : prev.bankId,
                                        account: selectedCompany ? selectedCompany.account : prev.account
                                    }));
                                }}
                                renderInput={(params) => <TextField {...params} label="Empresa" fullWidth size="small" sx={styles.customTextField} />}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Autocomplete
                                options={banksList.map(b => b.BankName)}
                                value={formData.bank || null}
                                onChange={(event, newValue) => {
                                    const selectedBank = banksList.find(b => b.BankName === newValue);
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        bank: newValue || '', 
                                        bankId: selectedBank ? selectedBank.BankID : '' 
                                    }));
                                }}
                                renderInput={(params) => <TextField {...params} label="Banco Pagador" fullWidth size="small" sx={styles.customTextField} />}
                            />
                            <TextField 
                                label="Número de Cuenta (20 dígitos)*" name="account" type="text" value={formData.account} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^[0-9]+$/.test(val)) handleInputChange(e);
                                }} 
                                fullWidth size="small" sx={styles.customTextField}
                                inputProps={{ maxLength: 20, inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField label="Dólares Comprados ($)" name="dollarsBought" type="number" value={formData.dollarsBought} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ min: 0, step: "any" }} />
                            <TextField label="Tasa (Bs.)" name="exchangeRate" type="number" value={formData.exchangeRate} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} inputProps={{ min: 0, step: "any" }} />
                            <TextField 
                                label="Bolívares (Bs.)" 
                                name="bolivares" 
                                type="number" 
                                value={formData.bolivares} 
                                fullWidth 
                                size="small" 
                                sx={styles.customTextField} 
                                inputProps={{ min: 0, step: "any" }} 
                                InputProps={{ readOnly: true }} 
                            />
                        </Box>

                        <TextField label="Observaciones" name="observations" multiline rows={2} value={formData.observations} onChange={handleInputChange} fullWidth size="small" sx={styles.customTextField} />
                    </DialogContent>
                    
                    <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                        <Button onClick={handleCloseModal} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                        <Button onClick={handleSaveTransaction} variant="contained" sx={styles.darkButton}>Guardar</Button>
                    </DialogActions>
                </Dialog>

                {/* --- LOADING BACKDROP --- */}
                <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }} open={isLoading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress color="inherit" size={60} thickness={4} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Cargando datos...</Typography>
                    </Box>
                </Backdrop>
            </Box>
        </LayoutBasePurchases>
    );
};

export default PurchasesHome;