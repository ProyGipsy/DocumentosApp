import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import LayoutBasePurchases from '../base/LayoutBasePurchases';
import BeneficiariesModal from './BeneficiariesModal';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Typography, Button, Box, IconButton, Backdrop, CircularProgress, InputBase
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

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
        backgroundColor: '#6d36ce',
        color: 'white',
        borderRadius: '0 8px 8px 0',
        width: '55px',
        height: '100%',
        '&:hover': {
            backgroundColor: '#975cfc',
        }
    },
    // Estilos de la Tabla y Botones Generales
    tableHeader: {
        backgroundColor: '#6d36ce', 
        fontWeight: 'bold', 
        color: '#f4f4f4', 
        transition: 'background-color 0.3s ease', 
        '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' }
    },
    darkButton: {
        backgroundColor: '#6d36ce', 
        color: '#f4f4f4', 
        fontWeight: 'bold', 
        borderRadius: '16px',
        padding: '10px 20px',
        boxShadow: 3,
        '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' }
    }
};

// --- MOCK DATA INICIAL ---
const initialMockData = [
    { id: 1, name: 'Inversiones XYZ', bank: 'Banesco', account: '01340000000000000000', observations: 'Pago a proveedores' },
    { id: 2, name: 'Servicios Corporativos', bank: 'Mercantil', account: '01050000000000000000', observations: 'Suscripción mensual' }
];

const Beneficiaries = () => {
    const { user } = useAuth();
    
    // --- ESTADOS ---
    const [allBeneficiaries, setAllBeneficiaries] = useState(initialMockData);
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState(initialMockData);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    
    // Carga
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    const [beneficiaryToEdit, setBeneficiaryToEdit] = useState(null);

    // --- EFECTO DE BÚSQUEDA ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredBeneficiaries(allBeneficiaries);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allBeneficiaries.filter(b =>
            b.name.toLowerCase().includes(lowerCaseSearch) || 
            b.bank.toLowerCase().includes(lowerCaseSearch) ||
            b.account.includes(lowerCaseSearch)
        );
        setFilteredBeneficiaries(results);
        setPage(0); // Regresar a la página 0 al buscar
    }, [searchTerm, allBeneficiaries]);

    // --- MANEJADORES DE PAGINACIÓN ---
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // --- MANEJADORES DEL MODAL ---
    const handleAddClick = () => {
        setModalMode('add');
        setBeneficiaryToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (beneficiary) => {
        setModalMode('edit');
        setBeneficiaryToEdit(beneficiary);
        setIsModalOpen(true);
    };

    // Callback para guardar desde el modal
    const handleSaveBeneficiary = (savedData, mode) => {
        setIsLoading(true);
        // Simulamos el retraso de una llamada al backend
        setTimeout(() => {
            if (mode === 'add') {
                const newId = Math.max(0, ...allBeneficiaries.map(b => b.id)) + 1;
                setAllBeneficiaries(prev => [{ ...savedData, id: newId }, ...prev]);
            } else {
                setAllBeneficiaries(prev => prev.map(b => b.id === savedData.id ? savedData : b));
            }
            setIsLoading(false);
            setIsModalOpen(false);
        }, 800);
    };

    return (
        <LayoutBasePurchases activePage="beneficiaries">
            <Box sx={styles.container}>
                
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>
                        Gestión de Beneficiarios
                    </Typography>
                    <Typography variant="h6" sx={styles.titleH3}>
                        Directorio de recepción de divisas (*)
                    </Typography>
                </Box>

                {/* --- BARRA DE BÚSQUEDA TIPO MATERIAL UI COMPUESTA --- */}
                <Paper component="form" sx={styles.searchContainer} onSubmit={(e) => e.preventDefault()}>
                    <InputBase
                        sx={styles.searchInput}
                        placeholder="Buscar por Nombre, Banco o Cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputProps={{ 'aria-label': 'buscar beneficiarios' }}
                    />
                </Paper>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={styles.darkButton} onClick={handleAddClick}>
                        Agregar Beneficiario
                    </Button>
                </Box>

                {/* --- TABLA MUI --- */}
                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de beneficiarios">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>Beneficiario</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco</TableCell>
                                    <TableCell sx={styles.tableHeader}>Número de Cuenta</TableCell>
                                    <TableCell sx={styles.tableHeader}>Observaciones</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBeneficiaries.length > 0 ? (
                                    filteredBeneficiaries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                        <TableRow hover key={row.id}>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#421d83' }}>{row.name}</TableCell>
                                            <TableCell>{row.bank}</TableCell>
                                            <TableCell>{row.account}</TableCell>
                                            <TableCell>{row.observations}</TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    color="primary" 
                                                    onClick={() => handleEditClick(row)} 
                                                    title="Editar Beneficiario"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">No se encontraron beneficiarios.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination 
                        rowsPerPageOptions={[5, 10, 25]} 
                        component="div" 
                        count={filteredBeneficiaries.length} 
                        rowsPerPage={rowsPerPage} 
                        page={page} 
                        onPageChange={handleChangePage} 
                        onRowsPerPageChange={handleChangeRowsPerPage} 
                        labelRowsPerPage="Filas por página:" 
                    />
                </Paper>

                {/* --- COMPONENTE MODAL --- */}
                <BeneficiariesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    beneficiary={beneficiaryToEdit}
                    onSave={handleSaveBeneficiary}
                />

                {/* --- CARGA (BACKDROP) --- */}
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                    open={isLoading}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress color="inherit" size={60} thickness={4} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Procesando...</Typography>
                    </Box>
                </Backdrop>
            </Box>
        </LayoutBasePurchases>
    );
};

export default Beneficiaries;