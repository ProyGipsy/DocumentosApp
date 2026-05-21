import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import LayoutBaseAvailability from '../base/LayoutBaseAvailability';
import AvailabilityTable from '../base/AvailabilityTable'; 
import { Typography, Box, Paper, ToggleButton, ToggleButtonGroup, Autocomplete, TextField, Backdrop, CircularProgress } from '@mui/material';

// --- CONFIGURACIÓN DE API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const THEMES = {
    bolivares: { main: '#2e7d32', bg: '#e8f5e9' },
    custodia: { main: '#d84315', bg: '#fbe9e7' },
    usa: { main: '#0277bd', bg: '#e1f5fe' }
};

const styles = {
    container: { 
        padding: '30px', 
        backgroundColor: 'rgb(240, 240, 240)', 
        minHeight: 'calc(100vh - 40px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        paddingBottom: '60px'
    },
    titleSection: { 
        width: '100%', 
        maxWidth: '1400px', 
        textAlign: 'center', 
        marginBottom: '20px' 
    },
    titleH2: { 
        color: '#262626', 
        marginBottom: '5px', 
        fontWeight: 600, 
        textTransform: 'uppercase' 
    },
    titleH3: { 
        color: '#262626', 
        marginTop: 0, 
        fontWeight: 500, 
        fontSize: '1.2em' 
    },
    controlsWrapper: { 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        width: '95%', 
        maxWidth: '1400px', 
        gap: '20px', 
        marginBottom: '35px', 
        justifyContent: 'space-between' 
    },
    unifiedControl: {
        flex: 1, 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', 
        height: '56px', 
        display: 'flex', 
        transition: 'box-shadow 0.3s ease',
        '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' },
        '& .MuiOutlinedInput-root': { 
            height: '100%', 
            borderRadius: '8px', 
            '& fieldset': { border: '1px solid transparent' }, 
            '&:hover fieldset': { border: '1px solid #ccc' }, 
            '&.Mui-focused fieldset': { border: '1px solid #262626' } 
        },
        '& .MuiToggleButtonGroup-root': { width: '100%', padding: '4px' },
        '& .MuiToggleButton-root': { 
            flex: 1, 
            border: 'none', 
            borderRadius: '6px !important', 
            margin: '0 2px', 
            color: '#888', 
            '&.Mui-selected': { backgroundColor: '#e0e0e0', color: '#262626' } 
        }
    },
    paperCard: { 
        width: '100%',
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)', 
        overflow: 'hidden' 
    }
};

const AvailabilityReport = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('base');
    const [empresaFilter, setEmpresaFilter] = useState(null);
    const [bancoFilter, setBancoFilter] = useState(null);
    const [currentExchangeRate, setCurrentExchangeRate] = useState(0);

    // --- ESTADO PARA LOS DATOS GRANULARES Y ERRORES ---
    const [reportData, setReportData] = useState({
        bolivares: [],
        custodia: [],
        usa: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false); // NUEVO ESTADO PARA MANEJAR FALLOS DE CONEXIÓN

    // --- OBTENER TASA DE CAMBIO VIVA ---
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const token = sessionStorage.getItem('session_token');
                const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
                const response = await fetch(`${apiUrl}/availability/reports/getMarketExchangeRate`, { method: 'GET', headers });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data) setCurrentExchangeRate(data);
                }
            } catch (error) {
                console.error("Error fetching exchange rate:", error);
            }
        };

        fetchExchangeRate();
    }, []);

    const isDolarized = viewMode === 'usd';

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) setViewMode(newMode);
    };

    // --- CONSUMO DE ENDPOINTS EN PARALELO ---
    useEffect(() => {
        const fetchReportData = async () => {
            const token = sessionStorage.getItem('session_token');
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            setIsLoading(true);
            setHasError(false); // Reiniciamos el error al cargar

            try {
                const [resNat, resCust, resUsa] = await Promise.all([
                    fetch(`${apiUrl}/availability/reports/getNationalBalances`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/reports/getCustodyBalances`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/availability/reports/getUSABalances`, { method: 'GET', headers })
                ]);

                // Verificamos si hubo un fallo general de red (por ejemplo, servidor caído)
                if (!resNat.ok && !resCust.ok && !resUsa.ok) {
                    throw new Error("No se pudo obtener la data de los servidores.");
                }

                const nationalData = resNat.ok ? await resNat.json() : [];
                const custodyData = resCust.ok ? await resCust.json() : [];
                const usaData = resUsa.ok ? await resUsa.json() : [];

                setReportData({
                    bolivares: nationalData,
                    custodia: custodyData,
                    usa: usaData
                });

            } catch (error) {
                console.error("Error de conexión al cargar la disponibilidad consolidada:", error);
                setHasError(true); // Disparamos el estado de error
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchReportData();
    }, [user]);

    const filteredEmpresaOptions = useMemo(() => {
        const allData = [...reportData.bolivares, ...reportData.custodia, ...reportData.usa];
        if (bancoFilter) {
            const empresasConFondos = allData.filter(d => d.banco === bancoFilter).map(d => d.empresa);
            return [...new Set(empresasConFondos.filter(Boolean))].sort();
        }
        return [...new Set(allData.map(d => d.empresa).filter(Boolean))].sort();
    }, [reportData, bancoFilter]);

    const filteredBancoOptions = useMemo(() => {
        const allData = [...reportData.bolivares, ...reportData.custodia, ...reportData.usa];
        if (empresaFilter) {
            const bancosDeLaEmpresa = allData.filter(d => d.empresa === empresaFilter).map(d => d.banco);
            return [...new Set(bancosDeLaEmpresa.filter(Boolean))].sort();
        }
        return [...new Set(allData.map(d => d.banco).filter(Boolean))].sort();
    }, [reportData, empresaFilter]);

    const pivotData = (granularArray, groupBy) => {
        if (!granularArray || granularArray.length === 0) return [];

        let filteredArray = granularArray;

        if (empresaFilter) {
            filteredArray = filteredArray.filter(item => item.empresa === empresaFilter);
        }
        if (bancoFilter) {
            filteredArray = filteredArray.filter(item => item.banco === bancoFilter);
        }

        const grouped = {};
        filteredArray.forEach(row => {
            const key = row[groupBy];
            if (!key) return;

            if (!grouped[key]) {
                grouped[key] = { [groupBy]: key, saldo: 0, transito: 0, disponible: 0 };
            }
            
            grouped[key].saldo += (Number(row.saldo) || 0);
            grouped[key].transito += (Number(row.transito) || 0);
            grouped[key].disponible += (Number(row.disponible) || 0);
        });

        return Object.values(grouped);
    };

    // --- PRE-CÁLCULO DE ARREGLOS PARA EVALUAR OCULTAMIENTO ---
    const tablesData = useMemo(() => {
        return {
            bolivaresBancos: pivotData(reportData.bolivares, 'banco'),
            bolivaresEmpresas: pivotData(reportData.bolivares, 'empresa'),
            custodiaBancos: pivotData(reportData.custodia, 'banco'),
            custodiaEmpresas: pivotData(reportData.custodia, 'empresa'),
            usaBancos: pivotData(reportData.usa, 'banco'),
            usaEmpresas: pivotData(reportData.usa, 'empresa')
        };
    }, [reportData, empresaFilter, bancoFilter]);

    // Evaluación global de si hay o no datos para pintar en pantalla
    const hasVisibleData = Object.values(tablesData).some(arr => arr.length > 0);

    return (
        <LayoutBaseAvailability activePage="reports">
            <Box sx={styles.container}>
                
                {/* --- TÍTULO --- */}
                <Box sx={styles.titleSection}>
                    <Typography variant="h4" sx={styles.titleH2}>
                        DISPONIBILIDAD BANCARIA 
                        {isDolarized && <span style={{ color: '#2e7d32' }}> DOLARIZADA</span>}
                    </Typography>
                    <Typography variant="h6" sx={styles.titleH3}>
                        Resumen general por Bancos y Empresas
                    </Typography>
                </Box>

                {/* --- CONTROLES Y FILTROS UNIFICADOS --- */}
                <Box sx={styles.controlsWrapper}>
                    <Autocomplete
                        options={filteredEmpresaOptions}
                        value={empresaFilter}
                        onChange={(event, newValue) => setEmpresaFilter(newValue)}
                        sx={styles.unifiedControl}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Empresa" />}
                        disabled={hasError}
                    />
                    
                    <Autocomplete
                        options={filteredBancoOptions}
                        value={bancoFilter}
                        onChange={(event, newValue) => setBancoFilter(newValue)}
                        sx={styles.unifiedControl}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Banco" />}
                        disabled={hasError}
                    />

                    <Box sx={styles.unifiedControl}>
                        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} disabled={hasError}>
                            <ToggleButton value="base" sx={{ fontWeight: 'bold' }}>Disponibilidad</ToggleButton>
                            <ToggleButton value="usd" sx={{ fontWeight: 'bold' }}>Disponibilidad $</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {/* --- SECCIÓN DE TABLAS O ESTADO DE ERROR / VACÍO --- */}
                <Box sx={{ width: '95%', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Renderizado de Feedback Alternativo (Si hay error de BD o si los filtros dejan todo vacío) */}
                    {!isLoading && (hasError || !hasVisibleData) ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.08)' }}>
                            <Typography variant="h6" sx={{ color: '#555' }}>
                                {hasError 
                                    ? 'No se pudo cargar la disponibilidad en tiempo real.' 
                                    : 'No se encontraron saldos bancarios para mostrar con los filtros actuales.'}
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#888', mt: 1 }}>
                                {hasError 
                                    ? 'Por favor, verifica tu conexión al servidor o contacta a soporte técnico si el problema persiste.' 
                                    : 'Intenta modificar o limpiar los filtros de Banco y Empresa para visualizar nuevamente los saldos.'}
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            {/* BOLÍVARES */}
                            {tablesData.bolivaresBancos.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="Bolívares - Bancos" 
                                        data={tablesData.bolivaresBancos} 
                                        colorTheme={THEMES.bolivares} isDolarized={isDolarized} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Banco" firstColumnKey="banco"
                                    />
                                </Paper>
                            )}

                            {tablesData.bolivaresEmpresas.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="Bolívares - Empresas" 
                                        data={tablesData.bolivaresEmpresas} 
                                        colorTheme={THEMES.bolivares} isDolarized={isDolarized} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Empresa" firstColumnKey="empresa"
                                    />
                                </Paper>
                            )}

                            {/* CUSTODIA */}
                            {tablesData.custodiaBancos.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="Custodia - Bancos" 
                                        data={tablesData.custodiaBancos} 
                                        colorTheme={THEMES.custodia} isDolarized={false} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Banco" firstColumnKey="banco"
                                    />
                                </Paper>
                            )}

                            {tablesData.custodiaEmpresas.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="Custodia - Empresas" 
                                        data={tablesData.custodiaEmpresas} 
                                        colorTheme={THEMES.custodia} isDolarized={false} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Empresa" firstColumnKey="empresa"
                                    />
                                </Paper>
                            )}

                            {/* USA / DÓLARES */}
                            {tablesData.usaBancos.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="USA - Bancos" 
                                        data={tablesData.usaBancos} 
                                        colorTheme={THEMES.usa} isDolarized={false} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Banco" firstColumnKey="banco"
                                    />
                                </Paper>
                            )}

                            {tablesData.usaEmpresas.length > 0 && (
                                <Paper sx={styles.paperCard}>
                                    <AvailabilityTable 
                                        title="USA - Empresas" 
                                        data={tablesData.usaEmpresas} 
                                        colorTheme={THEMES.usa} isDolarized={false} exchangeRate={currentExchangeRate}
                                        firstColumnLabel="Empresa" firstColumnKey="empresa"
                                    />
                                </Paper>
                            )}
                        </>
                    )}
                </Box>

                {/* --- BACKDROP DE CARGA --- */}
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
                        Consolidando saldos en tiempo real...
                    </Typography>
                </Backdrop>

            </Box>
        </LayoutBaseAvailability>
    );
};

export default AvailabilityReport;