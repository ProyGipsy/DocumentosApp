import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import LayoutBaseAvailability from '../base/LayoutBaseAvailability';
import AvailabilityTable from '../base/AvailabilityTable'; 
import { Typography, Box, Paper, ToggleButton, ToggleButtonGroup, Autocomplete, TextField } from '@mui/material';

// --- MOCK DATA ---
const mockData = {
    summary: {
        bolivares: [
            { banco: "Banco de Venezuela", saldo: 3650.25, transito: 0.00, disponible: 3650.25 },
            { banco: "Banesco", saldo: 556944.80, transito: 0.00, disponible: 556944.80 },
            { banco: "BNC", saldo: 3657882.09, transito: 0.00, disponible: 3657882.09 },
            { banco: "Mercantil", saldo: 76038878.47, transito: 8954079.01, disponible: 67084799.46 }
        ],
        custodia: [
            { banco: "BNC", saldo: 332.88, transito: 0.00, disponible: 332.88 },
            { banco: "Mercantil", saldo: 26031.97, transito: 0.00, disponible: 26031.97 }
        ],
        usa: [
            { banco: "Chase", saldo: 129844.83, transito: 0.00, disponible: 129844.83 },
            { banco: "Truist", saldo: 55337.50, transito: 0.00, disponible: 55337.50 }
        ]
    },
    detailed: {
        bolivares: [
            { empresa: "Belleza Import 2022 C.A", saldo: 6592317.19, transito: 0.00, disponible: 6592317.19 },
            { empresa: "Chic Import 2021 c. a.", saldo: 8875890.59, transito: 5333526.28, disponible: 3542364.31 },
            { empresa: "Corporacion Travel Corner, c. a.", saldo: 9644.51, transito: 179623.38, disponible: -169978.87 },
            { empresa: "Glow Cosmetics Universal C A", saldo: 52342614.35, transito: 3387388.14, disponible: 48955226.21 }
        ],
        custodia: [
            { empresa: "Corporacion 362616, c. a.", saldo: 17985.42, transito: 0.00, disponible: 17985.42 },
            { empresa: "Corporación Gipsy de Venezuela C.A", saldo: 815.52, transito: 0.00, disponible: 815.52 }
        ],
        usa: [
            { empresa: "Avanti Distribuitors LLC", saldo: 78818.48, transito: 0.00, disponible: 78818.48 },
            { empresa: "Kaleidos Corporation", saldo: 41674.06, transito: 0.00, disponible: 41674.06 }
        ]
    }
};

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
        paddingBottom: '60px' // Espacio extra al final para hacer scroll cómodamente
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

    const currentExchangeRate = 45.25; 
    const isDolarized = viewMode === 'usd';

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) setViewMode(newMode);
    };

    const allEmpresas = useMemo(() => {
        const empresas = [
            ...mockData.detailed.bolivares.map(d => d.empresa),
            ...mockData.detailed.custodia.map(d => d.empresa),
            ...mockData.detailed.usa.map(d => d.empresa)
        ];
        return [...new Set(empresas)].sort();
    }, []);

    const allBancos = useMemo(() => {
        const bancos = [
            ...mockData.summary.bolivares.map(d => d.banco),
            ...mockData.summary.custodia.map(d => d.banco),
            ...mockData.summary.usa.map(d => d.banco)
        ];
        return [...new Set(bancos)].sort();
    }, []);

    const filterData = (dataArray, key, filterValue) => {
        if (!filterValue) return dataArray;
        return dataArray.filter(item => item[key] === filterValue);
    };

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
                        options={allEmpresas} value={empresaFilter}
                        onChange={(event, newValue) => setEmpresaFilter(newValue)}
                        sx={styles.unifiedControl}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Empresa" />}
                    />
                    
                    <Autocomplete
                        options={allBancos} value={bancoFilter}
                        onChange={(event, newValue) => setBancoFilter(newValue)}
                        sx={styles.unifiedControl}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Banco" />}
                    />

                    <Box sx={styles.unifiedControl}>
                        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange}>
                            <ToggleButton value="base" sx={{ fontWeight: 'bold' }}>Disponibilidad</ToggleButton>
                            <ToggleButton value="usd" sx={{ fontWeight: 'bold' }}>Disponibilidad $</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {/* --- SECCIÓN DE TABLAS (Listado Vertical Único) --- */}
                <Box sx={{ width: '95%', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* BOLÍVARES */}
                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="Bolívares - Bancos" 
                            data={filterData(mockData.summary.bolivares, 'banco', bancoFilter)} 
                            colorTheme={THEMES.bolivares} isDolarized={isDolarized} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Banco" firstColumnKey="banco"
                        />
                    </Paper>

                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="Bolívares - Empresas" 
                            data={filterData(mockData.detailed.bolivares, 'empresa', empresaFilter)} 
                            colorTheme={THEMES.bolivares} isDolarized={isDolarized} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Empresa" firstColumnKey="empresa"
                        />
                    </Paper>

                    {/* CUSTODIA */}
                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="Custodia - Bancos" 
                            data={filterData(mockData.summary.custodia, 'banco', bancoFilter)} 
                            colorTheme={THEMES.custodia} isDolarized={false} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Banco" firstColumnKey="banco"
                        />
                    </Paper>

                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="Custodia - Empresas" 
                            data={filterData(mockData.detailed.custodia, 'empresa', empresaFilter)} 
                            colorTheme={THEMES.custodia} isDolarized={false} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Empresa" firstColumnKey="empresa"
                        />
                    </Paper>

                    {/* USA / DÓLARES */}
                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="USA - Bancos" 
                            data={filterData(mockData.summary.usa, 'banco', bancoFilter)} 
                            colorTheme={THEMES.usa} isDolarized={false} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Banco" firstColumnKey="banco"
                        />
                    </Paper>

                    <Paper sx={styles.paperCard}>
                        <AvailabilityTable 
                            title="USA - Empresas" 
                            data={filterData(mockData.detailed.usa, 'empresa', empresaFilter)} 
                            colorTheme={THEMES.usa} isDolarized={false} exchangeRate={currentExchangeRate}
                            firstColumnLabel="Empresa" firstColumnKey="empresa"
                        />
                    </Paper>

                </Box>
            </Box>
        </LayoutBaseAvailability>
    );
};

export default AvailabilityReport;