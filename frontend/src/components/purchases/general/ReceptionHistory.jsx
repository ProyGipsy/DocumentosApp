import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import LayoutBasePurchases from '../base/LayoutBasePurchases';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Typography, Box, TableSortLabel, InputBase, Backdrop, CircularProgress, Chip
} from '@mui/material';

// --- CONFIGURACIÓN DE API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- DICCIONARIO DE ESTILOS UNIFICADO ---
const styles = {
    container: { padding: '30px', backgroundColor: 'rgb(240, 240, 240)', minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    titleSection: { width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '10px' },
    titleH2: { color: '#191c16', marginBottom: '5px', fontWeight: 600 },
    titleH3: { color: '#61608b', marginTop: 0, fontWeight: 500, fontSize: '1.2em' },
    searchContainer: { p: '2px 4px', display: 'flex', alignItems: 'center', width: '90%', maxWidth: '500px', marginBottom: '50px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)', backgroundColor: '#f9f9f9', border: '1px solid #cccccc00', transition: 'background-color 0.3s', '&:focus-within': { backgroundColor: '#fff' } },
    searchInput: { ml: 1, flex: 1, padding: '8px 10px', color: '#191c16', '& input::placeholder': { color: '#888888', opacity: 1 } },
    tableHeader: { backgroundColor: '#6d36ce', fontWeight: 'bold', color: '#f4f4f4', transition: 'background-color 0.3s ease', '&:hover': { backgroundColor: '#975cfc', color: '#ffffff', cursor: 'pointer' } }
};

const ReceptionHistory = () => {
    const { user } = useAuth();
    
    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [allReceptions, setAllReceptions] = useState([]);
    const [filteredReceptions, setFilteredReceptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Paginación y Orden
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState('desc');

    // --- LLAMADA AL BACKEND ---
    const fetchSettlements = async () => {
        const token = sessionStorage.getItem('session_token');
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/purchases/getSettlements`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setAllReceptions(data);
                setFilteredReceptions(data);
            } else {
                console.error("Error al obtener liquidaciones:", response.statusText);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSettlements();
    }, [user]);

    // --- FILTRO Y ORDENAMIENTO ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredReceptions(allReceptions);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allReceptions.filter(trx =>
            (trx.receivingCompany && trx.receivingCompany.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.receivingBank && trx.receivingBank.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.account && trx.account.includes(lowerCaseSearch)) ||
            (trx.referenceNumber && trx.referenceNumber.toLowerCase().includes(lowerCaseSearch)) ||
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
            if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateString;
        } catch (error) { return dateString; }
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStatusColor = (status) => {
        if(status === 'Completada') return 'success';
        if(status === 'Parcial') return 'warning';
        if(status === 'Rechazada') return 'error';
        return 'default';
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
                        Historial de Recepción de Dólares
                    </Typography>
                    <Typography variant="h6" sx={styles.titleH3}>
                        Registro de operaciones liquidadas y validadas.
                    </Typography>
                </Box>

                {/* --- BARRA DE BÚSQUEDA --- */}
                <Paper component="form" sx={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={styles.searchInput}
                        placeholder="Buscar por empresa, banco, cuenta o referencia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputProps={{ 'aria-label': 'buscar recepciones' }}
                    />
                </Paper>

                {/* --- TABLA --- */}
                <Paper sx={{ width: '95%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de recepcion de fondos">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>
                                        <TableSortLabel active={true} direction={sortOrder} onClick={handleSortToggle} sx={{ color: '#f4f4f4 !important', '& .MuiTableSortLabel-icon': { color: '#f4f4f4 !important' } }}>
                                            Fecha de Recepción
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={styles.tableHeader}>Empresa Destino</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco Receptor</TableCell>
                                    <TableCell sx={styles.tableHeader}>Referencia</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Estatus</TableCell>
                                    <TableCell align='right' sx={styles.tableHeader}>Monto Recibido</TableCell>
                                    <TableCell sx={styles.tableHeader}>Observaciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedReceptions.length > 0 ? (
                                    sortedReceptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                            <TableCell>{formatDateToDDMMYYYY(trx.date)}</TableCell>
                                            <TableCell><strong>{trx.receivingCompany}</strong></TableCell>
                                            <TableCell>
                                                {trx.receivingBank}<br/>
                                                <span style={{ fontSize: '0.85em', color: '#555' }}>{trx.account}</span>
                                            </TableCell>
                                            <TableCell>{trx.referenceNumber || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={trx.status || 'Validada'} 
                                                    color={getStatusColor(trx.status)} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold' }} 
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                ${formatCurrency(trx.amountReceived)}
                                            </TableCell>
                                            <TableCell>{trx.observations}</TableCell>
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

                {/* --- BACKDROP CARGA --- */}
                <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(5px)' }} open={isLoading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress color="inherit" size={60} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cargando historial...</Typography>
                    </Box>
                </Backdrop>

            </Box>
        </LayoutBasePurchases>
    );
};

export default ReceptionHistory;