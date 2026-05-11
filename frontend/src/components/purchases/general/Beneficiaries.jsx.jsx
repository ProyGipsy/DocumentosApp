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

// --- CONFIGURACIÓN API ---
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
    tableHeader: { backgroundColor: '#6d36ce', fontWeight: 'bold', color: '#f4f4f4', transition: 'background-color 0.3s ease', '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' } },
    darkButton: { backgroundColor: '#6d36ce', color: '#f4f4f4', fontWeight: 'bold', borderRadius: '16px', padding: '10px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' } }
};

const Beneficiaries = () => {
    const { user } = useAuth();
    
    // --- ESTADOS ---
    const [allBeneficiaries, setAllBeneficiaries] = useState([]);
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [banksList, setBanksList] = useState([]); // <-- NUEVO ESTADO PARA BANCOS
    
    // Paginación y Carga
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    const [beneficiaryToEdit, setBeneficiaryToEdit] = useState(null);

    // --- 1. LLAMADA AL BACKEND: OBTENER BENEFICIARIOS Y BANCOS ---
    useEffect(() => {
        const fetchInitialData = async () => {
            const token = sessionStorage.getItem('session_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            setIsLoading(true);
            try {
                // Ejecutamos ambas peticiones en paralelo para mayor rapidez
                const [beneficiariesRes, banksRes] = await Promise.all([
                    fetch(`${apiUrl}/purchases/getBeneficiaries`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/getBanks`, { method: 'GET', headers }) // <-- Reutilizando el endpoint de disponibilidad
                ]);

                if (beneficiariesRes.ok) {
                    const data = await beneficiariesRes.json();
                    setAllBeneficiaries(data);
                }
                
                if (banksRes.ok) {
                    const banksData = await banksRes.json();
                    setBanksList(banksData);
                }

            } catch (error) {
                console.error("Network error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchInitialData();
        }
    }, [user]);

    // --- EFECTO DE BÚSQUEDA ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredBeneficiaries(allBeneficiaries);
            return;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = allBeneficiaries.filter(b =>
            (b.name && b.name.toLowerCase().includes(lowerCaseSearch)) || 
            (b.bank && b.bank.toLowerCase().includes(lowerCaseSearch)) ||
            (b.account && b.account.includes(lowerCaseSearch))
        );
        setFilteredBeneficiaries(results);
        setPage(0);
    }, [searchTerm, allBeneficiaries]);

    // --- MANEJADORES DE PAGINACIÓN Y MODAL ---
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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

    // --- 2. LLAMADA AL BACKEND: CREAR O ACTUALIZAR BENEFICIARIO ---
    const handleSaveBeneficiary = async (savedData, mode) => {
        const token = sessionStorage.getItem('session_token');
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };
        
        setIsLoading(true);

        try {
            if (mode === 'add') {
                const response = await fetch(`${apiUrl}/purchases/addBeneficiaries`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(savedData)
                });

                if (response.ok) {
                    const data = await response.json();
                    const newBeneficiary = { ...savedData, id: data.new_id };
                    setAllBeneficiaries([newBeneficiary, ...allBeneficiaries]);
                    setIsModalOpen(false);
                } else {
                    const err = await response.json();
                    alert(`Error al crear: ${err.error || 'Desconocido'}`);
                }
            } else {
                const response = await fetch(`${apiUrl}/purchases/updateBeneficiaries/${savedData.id}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(savedData)
                });

                if (response.ok) {
                    setAllBeneficiaries(prev => prev.map(b => b.id === savedData.id ? savedData : b));
                    setIsModalOpen(false);
                } else {
                    const err = await response.json();
                    alert(`Error al editar: ${err.error || 'Desconocido'}`);
                }
            }
        } catch (error) {
            console.error("Error saving beneficiary:", error);
            alert('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LayoutBasePurchases activePage="beneficiaries">
            <Box sx={styles.container}>
                
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>Gestión de Beneficiarios</Typography>
                    <Typography variant="h6" sx={styles.titleH3}>Directorio de recepción de divisas (*)</Typography>
                </Box>

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

                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de beneficiarios">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>Beneficiario</TableCell>
                                    <TableCell sx={styles.tableHeader}>Banco</TableCell>
                                    {/* <TableCell sx={styles.tableHeader}>Número de Cuenta</TableCell> */}
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
                                            {/* <TableCell>{row.account}</TableCell> */}
                                            <TableCell>{row.observations}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => handleEditClick(row)} title="Editar Beneficiario">
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
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredBeneficiaries.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" />
                </Paper>

                <BeneficiariesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    beneficiary={beneficiaryToEdit}
                    onSave={handleSaveBeneficiary}
                    banksList={banksList} // <-- PASAMOS LA LISTA DE BANCOS AL MODAL
                />

                <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }} open={isLoading}>
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