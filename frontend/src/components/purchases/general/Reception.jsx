import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import LayoutBasePurchases from '../base/LayoutBasePurchases';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, IconButton, Autocomplete, InputBase
} from '@mui/material';

// Iconos
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

// --- DICCIONARIO DE ESTILOS UNIFICADO (CSS + MUI) ---
const styles = {
    container: {
        padding: '30px',
        backgroundColor: 'rgb(240, 240, 240)',
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    titleSection: {
        width: '100%',
        maxWidth: '1200px',
        textAlign: 'center',
        marginBottom: '10px',
    },
    titleH2: {
        color: '#191c16',
        marginBottom: '5px',
        fontWeight: 600,
    },
    titleH3: {
        color: '#61608b',
        marginTop: 0,
        fontWeight: 500,
        fontSize: '1.2em',
    },
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
        backgroundColor: '#6d36ce',
        color: 'white',
        borderRadius: '0 8px 8px 0',
        width: '55px',
        height: '100%',
        '&:hover': {
            backgroundColor: '#975cfc',
        }
    },
    tableHeader: {
        backgroundColor: '#6d36ce', 
        fontWeight: 'bold', 
        color: '#f4f4f4', 
        transition: 'background-color 0.3s ease', 
        '&:hover': { backgroundColor: '#975cfc', color: '#ffffff', cursor: 'pointer' }
    },
    darkButton: {
        backgroundColor: '#6d36ce', 
        color: '#f4f4f4', 
        fontWeight: 'bold', 
        borderRadius: '16px',
        padding: '10px 20px',
        boxShadow: 3,
        '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' }
    },
    customTextField: {
        '& label.Mui-focused': { color: '#6d36ce' },
        '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': { borderColor: '#975cfc' },
        },
    }
};

// --- DATOS SIMULADOS (MOCKS) ---
const initialMockData = [
    {
        id: 1,
        date: '2025-10-16',
        receivingCompany: 'Inversiones XYZ',
        receivingBank: 'Banesco',
        account: '01340000000000009999',
        amountReceived: 1000.00, // Ajustado a dólares
        observations: 'Recepción exitosa'
    },
    {
        id: 2,
        date: '2025-10-19',
        receivingCompany: 'Servicios Corporativos',
        receivingBank: 'Provincial',
        account: '01080000000000008888',
        amountReceived: 500.00, // Ajustado a dólares
        observations: 'Llegó con un día de retraso'
    }
];

// Listas simuladas para los selects
const mockCompanies = ['Inversiones XYZ', 'Servicios Corporativos', 'Logística Omega'];
const mockBanks = ['Banesco', 'Mercantil', 'Provincial', 'BNC', 'Banco de Venezuela'];

const Reception = () => {
    const { user } = useAuth();
    
    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [allReceptions, setAllReceptions] = useState(initialMockData);
    const [filteredReceptions, setFilteredReceptions] = useState(initialMockData);
    
    // Paginación y Orden
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortOrder, setSortOrder] = useState('desc');

    // --- ESTADOS PARA MODALES ---
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        receivingCompany: '', 
        receivingBank: '', 
        account: '', 
        amountReceived: '',
        observations: ''
    });

    // --- FILTRO Y ORDENAMIENTO ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredReceptions(allReceptions);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allReceptions.filter(trx =>
            trx.receivingCompany.toLowerCase().includes(lowerCaseSearch) ||
            trx.receivingBank.toLowerCase().includes(lowerCaseSearch) ||
            trx.account.includes(lowerCaseSearch) ||
            (trx.observations && trx.observations.toLowerCase().includes(lowerCaseSearch))
        );
        setFilteredReceptions(results);
        setPage(0); 
    }, [searchTerm, allReceptions]);

    const sortedReceptions = [...filteredReceptions].sort((a, b) => {
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
            if(parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateString;
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // --- MANEJADORES DE MODAL ---
    const handleOpenCreateModal = () => {
        setEditingId(null); 
        setFormData({
            date: new Date().toISOString().split('T')[0],
            receivingCompany: '', receivingBank: '', account: '', 
            amountReceived: '', observations: ''
        });
        setOpenModal(true);
    };

    const handleOpenEditModal = (trx) => {
        setEditingId(trx.id); 
        setFormData({
            date: trx.date, 
            receivingCompany: trx.receivingCompany,
            receivingBank: trx.receivingBank,
            account: trx.account,
            amountReceived: trx.amountReceived, 
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveReception = () => {
        // Validaciones básicas
        if (!formData.receivingCompany || !formData.receivingBank || !formData.account || !formData.amountReceived) {
            alert("Por favor llena todos los campos obligatorios.");
            return;
        }

        const newReception = {
            id: editingId ? editingId : Math.max(0, ...allReceptions.map(t => t.id)) + 1, 
            date: formData.date,
            receivingCompany: formData.receivingCompany,
            receivingBank: formData.receivingBank,
            account: formData.account,
            amountReceived: parseFloat(formData.amountReceived),
            observations: formData.observations
        };

        if (editingId) {
            setAllReceptions(prev => prev.map(trx => trx.id === editingId ? newReception : trx));
        } else {
            setAllReceptions([newReception, ...allReceptions]);
        }
        
        handleCloseModal();
    };

    // --- MANEJADORES DE PAGINACIÓN ---
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <LayoutBasePurchases activePage="reception">
            <Box sx={styles.container}>
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>
                        Registro de Recepción de Fondos
                    </Typography>
                    <Typography variant="h6" sx={styles.titleH3}>
                        Listado de liquidaciones recibidas (*)
                    </Typography>
                </Box>

                {/* --- BARRA DE BÚSQUEDA --- */}
                <Paper component="form" sx={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={styles.searchInput}
                        placeholder="Buscar por empresa, banco, cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputProps={{ 'aria-label': 'buscar recepciones' }}
                    />
                </Paper>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={styles.darkButton} onClick={handleOpenCreateModal}>
                        Agregar Nueva Recepción (*)
                    </Button>
                </Box>

                {/* --- TABLA --- */}
                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de recepcion de fondos">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>
                                        <TableSortLabel active={true} direction={sortOrder} onClick={handleSortToggle} sx={{ color: '#f4f4f4 !important', '& .MuiTableSortLabel-icon': { color: '#f4f4f4 !important' } }}>
                                            Fecha de Recepción
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={styles.tableHeader}>Empresa que Recibe</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco que Recibe</TableCell>
                                    <TableCell sx={styles.tableHeader}>Número de Cuenta</TableCell>
                                    <TableCell align='right' sx={styles.tableHeader}>Monto Recibido</TableCell>
                                    <TableCell sx={styles.tableHeader}>Observaciones</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedReceptions.length > 0 ? (
                                    sortedReceptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                            <TableCell>{formatDateToDDMMYYYY(trx.date)}</TableCell>
                                            <TableCell>{trx.receivingCompany}</TableCell>
                                            <TableCell>{trx.receivingBank}</TableCell>
                                            <TableCell>{trx.account}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                ${formatCurrency(trx.amountReceived)}
                                            </TableCell>
                                            <TableCell>{trx.observations}</TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    color="primary" 
                                                    onClick={() => handleOpenEditModal(trx)} 
                                                    title="Editar"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">No se encontraron registros de recepción.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination 
                        rowsPerPageOptions={[5, 10, 25]} 
                        component="div" 
                        count={filteredReceptions.length} 
                        rowsPerPage={rowsPerPage} 
                        page={page} 
                        onPageChange={handleChangePage} 
                        onRowsPerPageChange={handleChangeRowsPerPage} 
                        labelRowsPerPage="Filas por página:" 
                    />
                </Paper>

                {/* --- MODAL PARA AGREGAR / EDITAR RECEPCIÓN --- */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
                        {editingId ? 'Editar Recepción' : 'Agregar Nueva Recepción'}
                    </DialogTitle>
                    <DialogContent sx={{ paddingTop: '20px !important', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 2 }}>
                            <TextField 
                                label="Fecha de Recepción" 
                                name="date" 
                                type="date" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                                InputLabelProps={{ shrink: true }} 
                                fullWidth 
                                size="small" 
                                sx={styles.customTextField} 
                            />
                            <Autocomplete
                                options={mockCompanies}
                                value={formData.receivingCompany || null}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, receivingCompany: newValue || '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Empresa que Recibe" fullWidth size="small" sx={styles.customTextField} />
                                )}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Autocomplete
                                options={mockBanks}
                                value={formData.receivingBank || null}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, receivingBank: newValue || '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Banco que Recibe" fullWidth size="small" sx={styles.customTextField} />
                                )}
                            />
                            <TextField 
                                label="Número de Cuenta" 
                                name="account" 
                                type="number" 
                                value={formData.account} 
                                onChange={handleInputChange} 
                                fullWidth 
                                size="small" 
                                sx={styles.customTextField}
                                onKeyDown={(e) => {
                                    if (['-', 'e', 'E', '+', '.'].includes(e.key)) e.preventDefault();
                                }}
                            />
                        </Box>

                        <TextField 
                            label="Monto Recibido ($)" 
                            name="amountReceived" 
                            type="number" 
                            value={formData.amountReceived} 
                            onChange={handleInputChange} 
                            fullWidth 
                            size="small" 
                            sx={styles.customTextField}
                            inputProps={{ min: 0, step: "any" }} 
                        />

                        <TextField 
                            label="Observaciones" 
                            name="observations" 
                            multiline 
                            rows={3} 
                            value={formData.observations} 
                            onChange={handleInputChange} 
                            fullWidth 
                            size="small" 
                            sx={styles.customTextField} 
                        />

                    </DialogContent>
                    
                    <DialogActions sx={{ padding: '16px', borderTop: '1px solid #ddd' }}>
                        <Button onClick={handleCloseModal} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                        <Button onClick={handleSaveReception} variant="contained" sx={styles.darkButton}>Guardar</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </LayoutBasePurchases>
    );
};

export default Reception;