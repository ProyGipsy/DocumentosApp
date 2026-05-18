import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBasePurchases from '../base/LayoutBasePurchases';
import { useAuth } from '../../../utils/AuthContext';
import PurchaseModal from './PurchaseModal';
import ValidatePurchaseModal from './ValidatePurchaseModal';

// Importaciones de Material UI
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
    Typography, Button, Box, TableSortLabel, IconButton, InputBase, Backdrop, CircularProgress
} from '@mui/material';

// Iconos
import EditIcon from '@mui/icons-material/Edit';
import ValidateIcon from '@mui/icons-material/DoneAll';
import ValidatedIcon from '@mui/icons-material/RemoveDone';

// --- CONFIGURACIÓN DE API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- DICCIONARIO DE ESTILOS UNIFICADO (CSS + MUI) ---
const styles = {
    container: { padding: '30px', backgroundColor: '#f0f0f0', minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    titleSection: { width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '10px' },
    titleH2: { color: '#191c16', marginBottom: '5px', fontWeight: 600 },
    titleH3: { color: '#61608b', marginTop: 0, fontWeight: 500, fontSize: '1.2em' },
    searchContainer: { p: '2px 4px', display: 'flex', alignItems: 'center', width: '90%', maxWidth: '500px', marginBottom: '50px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)', backgroundColor: '#f9f9f9', border: '1px solid #cccccc00', transition: 'background-color 0.3s', '&:focus-within': { backgroundColor: '#fff' } },
    searchInput: { ml: 1, flex: 1, padding: '8px 10px', color: '#191c16', '& input::placeholder': { color: '#888888', opacity: 1 } },
    tableHeader: { backgroundColor: '#6d36ce', fontWeight: 'bold', color: '#f4f4f4', transition: 'background-color 0.3s ease', '&:hover': { backgroundColor: '#975cfc', color: '#ffffff', cursor: 'pointer' } },
    darkButton: { backgroundColor: '#6d36ce', color: '#f4f4f4', fontWeight: 'bold', borderRadius: '16px', padding: '10px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#975cfc', color: '#ffffff' } },
    customTextField: { '& label.Mui-focused': { color: '#6d36ce' }, '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#975cfc' } } },
    successButton: { backgroundColor: '#2e7d32', color: '#ffffff', fontWeight: 'bold', borderRadius: '16px', padding: '8px 20px', boxShadow: 3, '&:hover': { backgroundColor: '#1b5e20' } }
};

const PurchasesHome = () => {
    const { user } = useAuth();
    
    // --- ESTADOS DE LA TABLA Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isFinalStatus, setIsFinalStatus] = useState(false);
    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    
    // --- ESTADOS DE CATÁLOGOS  ---
    const [banksList, setBanksList] = useState([]);
    const [originEntities, setOriginEntities] = useState([]);
    const [destEntities, setDestEntities] = useState([]);
    const [beneficiariesList, setBeneficiariesList] = useState([]);


    // Paginación, Orden y Carga
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortOrder, setSortOrder] = useState('desc');
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS PARA MODALES ---
    const [modalState, setModalState] = useState({ open: false, editingId: null, data: null });
    const [validateModalState, setValidateModalState] = useState({ open: false, purchase: null });

    // --- 1. LLAMADA AL BACKEND: OBTENER DATOS INICIALES ---
    const fetchInitialData = async () => {
        const token = sessionStorage.getItem('session_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        setIsLoading(true);
        try {
            const trxRes = await fetch(`${apiUrl}/purchases/getPurchases`, { method: 'GET', headers });

            if (trxRes.ok) {
                const trxData = await trxRes.json();
                setAllTransactions(trxData);
            } else {
                console.error("Error al cargar transacciones:", trxRes.statusText);
            }
        } catch (error) {
            console.error("Error al cargar la data inicial:", error);
        } finally {
            setIsLoading(false);
        }

        try {
            const [originRes, destRes, beneficiariesRes, banksRes] = await Promise.all([
                fetch(`${apiUrl}/purchases/getNationalEntities`, { method: 'GET', headers }),
                fetch(`${apiUrl}/purchases/getInternationalEntities`, { method: 'GET', headers }),
                fetch(`${apiUrl}/purchases/getBeneficiaries`, { method: 'GET', headers }),
                fetch(`${apiUrl}/availability/getBanks`, { method: 'GET', headers })
            ]);

            if (originRes.ok) {
                const originData = await originRes.json();
                setOriginEntities(originData);
            }

            if (destRes.ok) {
                const destData = await destRes.json();
                setDestEntities(destData);
            }

            if (beneficiariesRes.ok) {
                const beneficiariesData = await beneficiariesRes.json();
                setBeneficiariesList(beneficiariesData);
            }

            // CORRECCIÓN: Llenamos banksList con los bancos reales
            if (banksRes.ok) {
                const banksData = await banksRes.json();
                setBanksList(banksData);
            }
            
        } catch (error) {
            console.error("Error al cargar los catálogos:", error);
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
            (trx.provider && trx.provider.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.originEntity && trx.originEntity.toLowerCase().includes(lowerCaseSearch)) ||
            (trx.destEntity && trx.destEntity.toLowerCase().includes(lowerCaseSearch)) ||
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

    // --- CONEXIÓN CON POST Y PUT DEL BACKEND ---
    const handleSaveTransaction = async (formData) => {
        // 1. Validamos que todos los campos de IDs y montos estén presentes
        const requiredFields = [
            formData.date,
            formData.originEntityId, formData.originBankId, formData.originAccountId,
            formData.destEntityId, formData.destBankId, formData.destAccountId,
            formData.providerId, 
            formData.dollarsBought, formData.exchangeRate
        ];

        if (requiredFields.some(field => !field)) {
            alert("Por favor completa todos los campos requeridos de Origen, Destino, Proveedor y Compra.");
            return;
        }

        const payload = {
            date: formData.date,
            originEntityId: formData.originEntityId,
            originBankId: formData.originBankId,
            originAccountId: formData.originAccountId,
            destEntityId: formData.destEntityId,
            destBankId: formData.destBankId,
            destAccountId: formData.destAccountId,
            beneficiaryId: formData.providerId,
            dollarsBought: formData.dollarsBought,
            exchangeRate: formData.exchangeRate,
            bolivares: formData.bolivares,
            observations: formData.observations || ''
        };

        const token = sessionStorage.getItem('session_token');
        const method = modalState.editingId ? 'PUT' : 'POST';
        const url = modalState.editingId 
            ? `${apiUrl}/purchases/updatePurchase/${modalState.editingId}` 
            : `${apiUrl}/purchases/addPurchase`;

        setIsLoading(true);
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchInitialData();
                setModalState({ open: false, editingId: null, data: null });
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

    const handleConfirmValidation = async (id, validationData) => {
        const token = sessionStorage.getItem('session_token');
        setIsLoading(true);
        
        try {
            const response = await fetch(`${apiUrl}/purchases/validatePurchase/${id}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(validationData)
            });

            if (response.ok) {
                await fetchInitialData(); // Refrescamos la tabla
                setValidateModalState({ open: false, purchase: null });
                // Aquí podrías agregar un alert o snackbar de "Liquidación exitosa"
            } else {
                const error = await response.json();
                alert(`Error al validar: ${error.error}`);
            }
        } catch (error) {
            console.error("Error validando transacción:", error);
            alert('Error de conexión con el servidor al intentar validar.');
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
                </Paper>
                
                <Box sx={{ width: '90%', display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <Button variant="contained" sx={styles.darkButton} onClick={() => setModalState({ open: true, editingId: null, data: null })}>
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
                                    <TableCell sx={styles.tableHeader}>Origen (Bs.)</TableCell>
                                    <TableCell sx={styles.tableHeader}>Destino ($)</TableCell>
                                    <TableCell sx={styles.tableHeader}>Proveedor</TableCell>
                                    <TableCell align='right'  sx={styles.tableHeader}>Dólares</TableCell>
                                    <TableCell align='right'  sx={styles.tableHeader}>Tasa</TableCell>
                                    <TableCell align='right'  sx={styles.tableHeader}>Bolívares</TableCell>
                                    <TableCell align='center' sx={styles.tableHeader}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                            <TableCell>{formatDateToDDMMYYYY(trx.date)}</TableCell>
                                            
                                            {/* Mostramos Entidad y Banco para mayor claridad */}
                                            <TableCell>
                                                <strong>{trx.originEntity}</strong><br/>
                                                <span style={{ fontSize: '0.85em', color: '#555' }}>{trx.originBank}</span>
                                            </TableCell>
                                            <TableCell>
                                                <strong>{trx.destEntity}</strong><br/>
                                                <span style={{ fontSize: '0.85em', color: '#555' }}>{trx.destBank}</span>
                                            </TableCell>
                                            
                                            <TableCell>{trx.provider}</TableCell>
                                            
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>${formatCurrency(trx.dollarsBought)}</TableCell>
                                            <TableCell align="right">Bs. {formatCurrency(trx.exchangeRate)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Bs. {formatCurrency(trx.bolivares)}</TableCell>
                                            
                                            <TableCell align="center">
                                                {trx.isValidated ? (
                                                    <IconButton color="disabled" title="Compra Ya Validada" disabled={true}>
                                                        <ValidatedIcon />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton color="success" onClick={() => setValidateModalState({ open: true, purchase: trx })} title="Validar Compra">
                                                        <ValidateIcon />
                                                    </IconButton>
                                                )}
                                                
                                                <IconButton 
                                                    color="primary" 
                                                    onClick={() => setModalState({ open: true, editingId: trx.id, data: trx })} 
                                                    title="Editar"
                                                    disabled={!!trx.isValidated}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">No se encontraron registros.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredTransactions.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" />
                </Paper>

                <PurchaseModal 
                    isOpen={modalState.open} 
                    onClose={() => setModalState({ open: false, editingId: null, data: null })}
                    editingId={modalState.editingId}
                    initialData={modalState.data}
                    onSave={handleSaveTransaction}

                    originEntities={originEntities}
                    destEntities={destEntities}
                    beneficiariesList={beneficiariesList}
                    banksList={banksList} // CORRECCIÓN: Se agrega banksList como prop
                />

                <ValidatePurchaseModal 
                    isOpen={validateModalState.open}
                    onClose={() => setValidateModalState({ open: false, purchase: null })}
                    purchase={validateModalState.purchase}
                    onConfirm={handleConfirmValidation}
                    user={user}
                />

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