import React, { useMemo } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Typography, Box, TableSortLabel 
} from '@mui/material';

// Función auxiliar para dar el formato contable estricto: (Monto) si es negativo
const formatFinancial = (amount, symbol) => {
    if (amount === undefined || amount === null || isNaN(amount)) return `${symbol} 0,00`;
    const num = Number(amount);
    const formatted = Math.abs(num).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return num < 0 ? `(${symbol} ${formatted})` : `${symbol} ${formatted}`;
};

const AvailabilityTable = ({ 
    title, 
    data = [], 
    colorTheme, 
    isDolarized, 
    exchangeRate, 
    firstColumnLabel, 
    firstColumnKey 
}) => {
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState(firstColumnKey);

    // Determinar si la tabla debe aplicar conversión por moneda base (Bolívares) o si es fija en USD (Custodia / USA)
    const isTableInUSD = title.toLowerCase().includes('custodia') || title.toLowerCase().includes('usa') || isDolarized;
    const shouldApplyConversion = !title.toLowerCase().includes('custodia') && !title.toLowerCase().includes('usa') && isDolarized;
    
    const currencySymbol = isTableInUSD ? '$' : 'Bs.';
    const rate = Number(exchangeRate) || 1;

    // Manejo de ordenamiento de columnas
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // --- PROCESAMIENTO Y NORMALIZACIÓN DE LA DATA ---
    const processedRows = useMemo(() => {
        return data.map(row => {
            const rawSaldo = row.saldo !== undefined ? row.saldo : row.LedgerBalance;
            const rawTransito = row.transito !== undefined ? row.transito : row.TransitAmount;
            const rawDisponible = row.disponible !== undefined ? row.disponible : row.AvailableBalance;

            const nSaldo = Number(rawSaldo) || 0;
            const nTransito = Number(rawTransito) || 0;
            const nDisponible = Number(rawDisponible) || 0;

            return {
                ...row,
                displayLabel: row[firstColumnKey] || '',
                saldoValue: shouldApplyConversion ? (rate > 0 ? nSaldo / rate : 0) : nSaldo,
                transitoValue: shouldApplyConversion ? (rate > 0 ? nTransito / rate : 0) : nTransito,
                disponibleValue: shouldApplyConversion ? (rate > 0 ? nDisponible / rate : 0) : nDisponible,
            };
        });
    }, [data, shouldApplyConversion, rate, firstColumnKey]);

    // Ordenar las filas procesadas
    const sortedRows = useMemo(() => {
        const comparator = (a, b) => {
            let valA, valB;
            if (orderBy === firstColumnKey) {
                valA = a.displayLabel.toLowerCase();
                valB = b.displayLabel.toLowerCase();
            } else {
                valA = a[`${orderBy}Value`] || 0;
                valB = b[`${orderBy}Value`] || 0;
            }

            if (valB < valA) return order === 'asc' ? 1 : -1;
            if (valB > valA) return order === 'asc' ? -1 : 1;
            return 0;
        };
        return [...processedRows].sort(comparator);
    }, [processedRows, order, orderBy, firstColumnKey]);

    // --- CÁLCULO DE TOTALES ---
    const totalSaldo = useMemo(() => processedRows.reduce((acc, row) => acc + row.saldoValue, 0), [processedRows]);
    const totalTransito = useMemo(() => processedRows.reduce((acc, row) => acc + row.transitoValue, 0), [processedRows]);
    const totalDisponible = useMemo(() => processedRows.reduce((acc, row) => acc + row.disponibleValue, 0), [processedRows]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ 
                backgroundColor: colorTheme.bg, 
                padding: '16px 24px', 
                borderBottom: `2px solid ${colorTheme.main}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h6" sx={{ color: colorTheme.main, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {title} {shouldApplyConversion && "(Expresado en USD)"}
                </Typography>
            </Box>

            {/* Contenedor de la Tabla */}
            <TableContainer>
                <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead sx={{ backgroundColor: '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: '#555' }}>
                                <TableSortLabel
                                    active={orderBy === firstColumnKey}
                                    direction={orderBy === firstColumnKey ? order : 'asc'}
                                    onClick={() => handleRequestSort(firstColumnKey)}
                                >
                                    {firstColumnLabel}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#555' }}>
                                <TableSortLabel
                                    active={orderBy === 'saldo'}
                                    direction={orderBy === 'saldo' ? order : 'asc'}
                                    onClick={() => handleRequestSort('saldo')}
                                >
                                    Saldo
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#555' }}>
                                <TableSortLabel
                                    active={orderBy === 'transito'}
                                    direction={orderBy === 'transito' ? order : 'asc'}
                                    onClick={() => handleRequestSort('transito')}
                                >
                                    Tránsito
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#555', paddingRight: '24px' }}>
                                <TableSortLabel
                                    active={orderBy === 'disponible'}
                                    direction={orderBy === 'disponible' ? order : 'asc'}
                                    onClick={() => handleRequestSort('disponible')}
                                >
                                    Disponible
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedRows.length > 0 ? (
                            sortedRows.map((row, index) => (
                                <TableRow 
                                    key={index}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f9f9f9' } }}
                                >
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500, color: '#333' }}>
                                        {row.displayLabel}
                                    </TableCell>
                                    
                                    {/* Celdas del cuerpo con control estricto de color rojo si el valor es < 0 */}
                                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: row.saldoValue < 0 ? '#d32f2f' : '#2c2538' }}>
                                        {formatFinancial(row.saldoValue, currencySymbol)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: row.transitoValue < 0 ? '#d32f2f' : '#2c2538' }}>
                                        {formatFinancial(row.transitoValue, currencySymbol)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 'bold', paddingRight: '24px', color: row.disponibleValue < 0 ? '#d32f2f' : '#2e7d32' }}>
                                        {formatFinancial(row.disponibleValue, currencySymbol)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#888', fontStyle: 'italic' }}>
                                    No hay registros disponibles con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}

                        {/* --- FILA DE TOTALES --- */}
                        {processedRows.length > 0 && (
                            <TableRow sx={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #ddd' }}>
                                <TableCell sx={{ fontWeight: 'bold', color: '#262626', fontSize: '0.95rem' }}>
                                    TOTAL CONSOLIDADO
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', color: totalSaldo < 0 ? '#d32f2f' : '#262626' }}>
                                    {formatFinancial(totalSaldo, currencySymbol)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', color: totalTransito < 0 ? '#d32f2f' : '#262626' }}>
                                    {formatFinancial(totalTransito, currencySymbol)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.05rem', paddingRight: '24px', color: totalDisponible < 0 ? '#d32f2f' : '#2e7d32' }}>
                                    {formatFinancial(totalDisponible, currencySymbol)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AvailabilityTable;