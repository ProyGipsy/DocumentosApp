import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import searchIcon from '../../../assets/img/Lupa.png';
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
    Typography
} from '@mui/material';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- DATOS SIMULADOS (MOCKS) ---
// Representan transacciones bancarias con diferentes estados
const mockTransactions = [
    { id: 1, date: '2026-03-20', bank: 'Banesco', reference: '10293847', description: 'Pago Cliente A', amount: 1500.00, type: 'Ingreso', status: 'Conciliado' },
    { id: 2, date: '2026-03-21', bank: 'Mercantil', reference: '56473829', description: 'Pago Proveedor XYZ', amount: -450.50, type: 'Egreso', status: 'Pendiente' },
    { id: 3, date: '2026-03-21', bank: 'Provincial', reference: '99887766', description: 'Transferencia rechazada', amount: 300.00, type: 'Ingreso', status: 'Rechazado' },
    { id: 4, date: '2026-03-22', bank: 'Banesco', reference: '11223344', description: 'Abono Nómina', amount: -2100.00, type: 'Egreso', status: 'Conciliado' },
    { id: 5, date: '2026-03-23', bank: 'BNC', reference: '55667788', description: 'Pago Cliente B', amount: 850.00, type: 'Ingreso', status: 'Pendiente' },
    { id: 6, date: '2026-03-23', bank: 'Mercantil', reference: '33445566', description: 'Servicios Básicos', amount: -120.00, type: 'Egreso', status: 'Conciliado' },
    // Puedes duplicar algunos para probar la paginación
    { id: 7, date: '2026-03-24', bank: 'Provincial', reference: '77889900', description: 'Mantenimiento Oficina', amount: -350.00, type: 'Egreso', status: 'Pendiente' },
    { id: 8, date: '2026-03-24', bank: 'Banesco', reference: '22334455', description: 'Pago Cliente C', amount: 5000.00, type: 'Ingreso', status: 'Conciliado' },
    { id: 9, date: '2026-03-25', bank: 'BNC', reference: '66778899', description: 'Devolución', amount: 150.00, type: 'Ingreso', status: 'Rechazado' },
    { id: 10, date: '2026-03-25', bank: 'Mercantil', reference: '11992288', description: 'Compra Equipos', amount: -1250.00, type: 'Egreso', status: 'Conciliado' },
    { id: 11, date: '2026-03-26', bank: 'Banesco', reference: '99881122', description: 'Pago Cliente D', amount: 300.00, type: 'Ingreso', status: 'Pendiente' },
];

const AvailabilityHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const hasRole = (roleId) => {
        if (!user) return false;
        return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
    };

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
    
    // Estados para la paginación de Material UI
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Efecto para filtrar las transacciones
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTransactions(mockTransactions);
            setPage(0); // Reiniciar a la primera página al limpiar búsqueda
            return;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        const results = mockTransactions.filter(trx =>
            trx.description.toLowerCase().includes(lowerCaseSearch) ||
            trx.bank.toLowerCase().includes(lowerCaseSearch) ||
            trx.reference.toLowerCase().includes(lowerCaseSearch) ||
            trx.status.toLowerCase().includes(lowerCaseSearch)
        );

        setFilteredTransactions(results);
        setPage(0); // Reiniciar a la primera página al buscar
    }, [searchTerm]);

    // Manejadores de paginación
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Helper para dar color a los estados usando MUI Chips
    const getStatusChip = (status) => {
        let color = 'default';
        if (status === 'Conciliado') color = 'success';
        if (status === 'Pendiente') color = 'warning';
        if (status === 'Rechazado') color = 'error';

        return <Chip label={status} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    };

    const getTypeColor = (type) => {
        return type === 'Ingreso' ? '#2e7d32' : '#d32f2f'; // Verde para ingreso, Rojo para egreso
    };

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="home-admin-container-availability" style={{ padding: '20px', maxWidth: 'auto', margin: '0 auto' }}>
                {/* Título y Bienvenida */}
                <div className="title-section-home-availability" style={{ marginBottom: '20px' }}>
                    <Typography variant="h4" sx={{ color: '#262626', fontWeight: 'bold', mb: 1 }}>
                        Módulo de Disponibilidad Gipsy
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                        Bienvenido(a){user ? `, ${user.firstName}` : ''}
                    </Typography>
                </div>

                {/* Barra de Búsqueda */}
                <div className="search-bar-container-availability" style={{ display: 'flex', gap: '10px', marginBottom: '50px', maxWidth: '500px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por descripción, banco, referencia o estado..."
                        className="search-input-home-availability"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '10px 15px', borderRadius: '16px', border: '1px solid #ccc' }}
                    />
                </div>

                {/* Tabla de Transacciones */}
                <Paper sx={{ width: '90%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="tabla de disponibilidad">
                            <TableHead>
                                <TableRow>
                                    <TableCell 
                                        sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        Fecha
                                    </TableCell>
                                    <TableCell 
                                        sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        Entidad Bancaria
                                    </TableCell>
                                    <TableCell sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        Referencia
                                    </TableCell>
                                    <TableCell sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        Descripción
                                    </TableCell>
                                    <TableCell sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                        align='center'
                                    >
                                        Monto ($)
                                    </TableCell>
                                    <TableCell sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                        align='center'
                                    >
                                        Tipo
                                    </TableCell>
                                    <TableCell sx={{ 
                                            backgroundColor: '#262626', 
                                            fontWeight: 'bold', 
                                            color: '#f4f4f4',
                                            transition: 'background-color 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#595959',
                                                color: '#ffffff',
                                                cursor: 'pointer'
                                            }
                                        }}
                                        align='center'
                                    >
                                        Estado
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((trx) => (
                                            <TableRow hover role="checkbox" tabIndex={-1} key={trx.id}>
                                                <TableCell>{trx.date}</TableCell>
                                                <TableCell>{trx.bank}</TableCell>
                                                <TableCell>{trx.reference}</TableCell>
                                                <TableCell>{trx.description}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: getTypeColor(trx.type) }}>
                                                    {trx.amount > 0 ? '+' : ''}{trx.amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell align="center">{trx.type}</TableCell>
                                                <TableCell align="center">{getStatusChip(trx.status)}</TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">
                                                No se encontraron transacciones que coincidan con la búsqueda.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredTransactions.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </Paper>
            </div>
        </LayoutBaseAdmin>
    );
};

export default AvailabilityHome;