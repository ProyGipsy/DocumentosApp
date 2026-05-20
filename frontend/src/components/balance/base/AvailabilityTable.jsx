import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    TableSortLabel, Typography, Box 
} from '@mui/material';

const AvailabilityTable = ({ 
    title, 
    data, 
    colorTheme, 
    isDolarized, 
    exchangeRate, 
    firstColumnLabel, 
    firstColumnKey 
}) => {
    // Estado para el ordenamiento (Ascendente por defecto)
    const [sortOrder, setSortOrder] = useState('asc');

    const handleSortToggle = () => {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    // Función para ordenar la data basada en la primera columna (banco o empresa)
    const sortedData = [...data].sort((a, b) => {
        const valA = a[firstColumnKey].toString().toLowerCase();
        const valB = b[firstColumnKey].toString().toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Cálculos de Totales
    const totalSaldo = data.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
    const totalTransito = data.reduce((acc, curr) => acc + (curr.transito || 0), 0);
    const totalDisponible = data.reduce((acc, curr) => acc + (curr.disponible || 0), 0);

    // Formateador de moneda (Maneja Dólares, Bolívares y números negativos contables)
    const formatAmount = (amount) => {
        // 1. Convertimos si es necesario
        const value = isDolarized ? (amount / exchangeRate) : amount;
        
        // 2. Definimos prefijo
        // Excepción: Si es la tabla nativa de USA y estamos en modo 'base', igual se muestra en $
        // (Asumiendo que las cuentas USA siempre están en dólares, aunque el global esté en Bs. Ajusta esto si no es así)
        const prefix = (isDolarized || title === 'USA') ? '$' : 'Bs. ';

        // 3. Formateamos
        const isNegative = value < 0;
        const absoluteValue = Math.abs(value);
        const formattedNumber = absoluteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Si es negativo, usamos el formato contable (Prefijo Numero)
        if (isNegative) {
            return `(${prefix}${formattedNumber})`;
        }
        return `${prefix}${formattedNumber}`;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Cabecera Principal (Ej: Bolívares, Custodia, USA) */}
            <Typography 
                sx={{ 
                    padding: '8px 16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                    color: colorTheme.main, backgroundColor: colorTheme.bg, borderBottom: `2px solid ${colorTheme.main}`
                }}
            >
                {title}
            </Typography>

            <TableContainer sx={{ flexGrow: 1, maxHeight: 500 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <TableSortLabel 
                                    active={true} 
                                    direction={sortOrder} 
                                    onClick={handleSortToggle}
                                >
                                    {firstColumnLabel}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>Saldo</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>Tránsito</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>Disponible</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row, index) => (
                            <TableRow hover key={index} sx={{ '& td': { borderBottom: '1px solid #eee' } }}>
                                <TableCell>{row[firstColumnKey]}</TableCell>
                                <TableCell align="right">{formatAmount(row.saldo)}</TableCell>
                                <TableCell align="right">{formatAmount(row.transito)}</TableCell>
                                <TableCell align="right">{formatAmount(row.disponible)}</TableCell>
                            </TableRow>
                        ))}
                        {/* Fila de Totales */}
                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: colorTheme.main, borderBottom: 'none', borderTop: '2px solid #ddd' }}>
                                Total
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: colorTheme.main, borderBottom: 'none', borderTop: '2px solid #ddd' }}>
                                {formatAmount(totalSaldo)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: colorTheme.main, borderBottom: 'none', borderTop: '2px solid #ddd' }}>
                                {formatAmount(totalTransito)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: colorTheme.main, borderBottom: 'none', borderTop: '2px solid #ddd' }}>
                                {formatAmount(totalDisponible)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AvailabilityTable;