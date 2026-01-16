import React, { useState, useEffect } from 'react';
// 1. IMPORTAMOS MATERIAL UI
import { Select, MenuItem, FormControl, OutlinedInput } from '@mui/material';
import { useAuth } from '../../utils/AuthContext';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import SendDocumentModal from './SendDocumentModal';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 20;

// ESTILOS PERSONALIZADOS PARA MATERIAL UI (SX)
const aestheticSelectStyles = {
    // Estilo del Input (La caja principal)
    color: '#421d83', // Texto seleccionado morado
    backgroundColor: '#ffffff',
    borderRadius: '12px', // Bordes muy redondeados
    '.MuiOutlinedInput-notchedOutline': {
        borderColor: '#e0e0e0', // Borde gris suave por defecto
        transition: 'all 0.3s ease',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#8b56ed', // Borde lila al pasar el mouse
        borderWidth: '1px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#421d83', // Borde morado oscuro al hacer click
        borderWidth: '2px',
        boxShadow: '0 0 0 3px rgba(139, 86, 237, 0.2)', // Sombra suave (glow)
    },
    '.MuiSelect-icon': {
        color: '#8b56ed', // Flechita morada
    },
    // Estilo del texto placeholder
    '& .MuiSelect-select .placeholder': {
        color: '#421d83',
        opacity: 0.7,
    },
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)',
};

// Estilo del Menú Desplegable (El dropdown)
const menuPropsStyles = {
    PaperProps: {
        sx: {
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 8px 20px rgba(139, 86, 237, 0.25)',
            border: '1px solid #f0ebf8',
            '& .MuiMenuItem-root': {
                color: '#421d83',
                fontSize: '0.95rem',
                padding: '10px 18px',
                '&:hover': {
                    backgroundColor: '#f0ebf8', // Lila muy suave al pasar mouse
                },
                '&.Mui-selected': {
                    backgroundColor: '#421d83 !important', // Morado oscuro seleccionado
                    color: 'white',
                    fontWeight: 'bold',
                }
            }
        }
    }
};


const SendDocuments = ({ folderId, folderName }) => {
    const { user } = useAuth();
    
    // --- ESTADOS DE DATOS ---
    const [allDocuments, setAllDocuments] = useState([]); 
    const [filteredDocuments, setFilteredDocuments] = useState([]); 
    
    // --- ESTADOS DE UI ---
    const [isLoading, setIsLoading] = useState(false);
    const [dateHeaderLabel, setDateHeaderLabel] = useState('FECHA');
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    
    // --- ESTADOS DE FILTROS ---
    const [selectedType, setSelectedType] = useState(''); 
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    
    const [typeOptions, setTypeOptions] = useState([]);       
    const [companyOptions, setCompanyOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    // --- ESTADOS DE PAGINACIÓN Y SELECCIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

    // --- 1. CARGA DE TODOS LOS DATOS ---
    useEffect(() => {
        const fetchAllDocuments = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ page: 1, pageSize: 10000 });
                const response = await fetch(`${apiUrl}/documents/getAllDocumentsList?${params.toString()}`);
                if (!response.ok) throw new Error('Error al cargar documentos');
                const result = await response.json();
                const dataList = Array.isArray(result) ? result : (result.data || []);

                const formattedDocs = dataList.map(doc => ({
                    id: doc.DocumentID || doc.id,
                    name: `Documento #${doc.DocumentID || doc.id}`,
                    type: doc.TypeName || doc.docTypeName || 'Sin Tipo',
                    company: doc.CompanyName || doc.companyName || 'Sin Entidad',
                    date: doc.ExpirationDate || doc.AnnexDate || null 
                }));

                setAllDocuments(formattedDocs);
                setFilteredDocuments(formattedDocs);

                const anyHasExpiration = formattedDocs.some(fd => !!fd.date);
                setDateHeaderLabel(anyHasExpiration ? 'VENCIMIENTO' : 'FECHA');

                // --- GENERAR OPCIONES DE FILTRO ---
                const types = [...new Set(formattedDocs.map(d => d.type))].sort();
                setTypeOptions(types);

                const companies = [...new Set(formattedDocs.map(d => d.company))].sort();
                setCompanyOptions(companies);

                const years = [...new Set(formattedDocs
                    .map(d => d.date ? new Date(d.date).getFullYear() : null)
                    .filter(y => y !== null)
                )].sort((a, b) => b - a);
                setYearOptions(years);

            } catch (error) {
                console.error("Error cargando documentos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDocuments();
    }, [folderId]);

    // --- 2. LÓGICA DE FILTRADO ---
    useEffect(() => {
        let result = [...allDocuments];

        if (selectedType) {
            result = result.filter(doc => doc.type === selectedType);
        }
        if (selectedCompany) {
            result = result.filter(doc => doc.company === selectedCompany);
        }
        if (selectedYear) {
            result = result.filter(doc => {
                if (!doc.date) return false;
                const docYear = new Date(doc.date).getFullYear();
                return docYear.toString() === selectedYear.toString();
            });
        }

        if (sortConfig.key === 'date' && sortConfig.direction !== 'none') {
            result.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }

        setFilteredDocuments(result);
        setCurrentPage(1); 
    }, [selectedType, selectedCompany, selectedYear, allDocuments, sortConfig]);

    // --- 3. PAGINACIÓN Y HELPERS (SIN CAMBIOS) ---
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [y, m, d] = dateString.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('es-ES');
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES');
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : (sortConfig.direction === 'desc' ? 'none' : 'asc');
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key || sortConfig.direction === 'none') return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    // --- SELECCIÓN Y ENVÍO ---
    const isAllSelected = currentDocuments.length > 0 && currentDocuments.every(doc => selectedDocuments.includes(doc.id));

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const newSelected = new Set(selectedDocuments);
            currentDocuments.forEach(doc => newSelected.add(doc.id));
            setSelectedDocuments(Array.from(newSelected));
        } else {
            const currentIds = currentDocuments.map(doc => doc.id);
            const newSelected = selectedDocuments.filter(id => !currentIds.includes(id));
            setSelectedDocuments(newSelected);
        }
    };

    const handleSelectDocument = (docId) => {
        setSelectedDocuments(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const handleSendSelection = () => {
        if (selectedDocuments.length === 0) return alert('Selecciona al menos un documento');
        setIsSendModalOpen(true);
    };

    const onConfirmSend = async (ids, emailData) => { 
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/documents/sendDocuments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, documentIds: ids, emailData })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error en envío');
            alert('¡Enviado exitosamente!');
            setSelectedDocuments([]); 
            setIsSendModalOpen(false);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LayoutBase activePage="sendDocuments">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">
                    {folderName ? `Envío: ${folderName}` : 'Envío de Documentos'}
                </h2>
                <br />

                {/* --- FILTROS CON MATERIAL UI --- */}
                <div className="search-and-controls">
                    <div className="aesthetic-filters-container">
                        
                        {/* 1. Filtro Tipo */}
                        <FormControl sx={{ flex: 1, minWidth: '200px' }} size="small">
                            <Select
                                displayEmpty
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <span className="placeholder">Todos los Tipos</span>;
                                    }
                                    return selected;
                                }}
                                sx={aestheticSelectStyles}
                                MenuProps={menuPropsStyles}
                            >
                                <MenuItem value="">
                                    <em>Todos los Tipos</em>
                                </MenuItem>
                                {typeOptions.map((type, idx) => (
                                    <MenuItem key={idx} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 2. Filtro Entidad */}
                        <FormControl sx={{ flex: 1, minWidth: '200px' }} size="small">
                            <Select
                                displayEmpty
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <span className="placeholder">Todas las Entidades</span>;
                                    }
                                    return selected;
                                }}
                                sx={aestheticSelectStyles}
                                MenuProps={menuPropsStyles}
                            >
                                <MenuItem value="">
                                    <em>Todas las Entidades</em>
                                </MenuItem>
                                {companyOptions.map((comp, idx) => (
                                    <MenuItem key={idx} value={comp}>{comp}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 3. Filtro Año */}
                        <FormControl sx={{ flex: 1, minWidth: '200px' }} size="small">
                            <Select
                                displayEmpty
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <span className="placeholder">Todos los Años</span>;
                                    }
                                    return selected;
                                }}
                                sx={aestheticSelectStyles}
                                MenuProps={menuPropsStyles}
                            >
                                <MenuItem value="">
                                    <em>Todos los Años</em>
                                </MenuItem>
                                {yearOptions.map((year, idx) => (
                                    <MenuItem key={idx} value={year.toString()}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    </div>
                </div>

                {/* --- TABLA --- */}
                <div className="send-action-and-table-container">
                    <button 
                        className="send-selection-button" 
                        onClick={handleSendSelection}
                        disabled={selectedDocuments.length === 0 || isLoading}
                        style={{opacity: selectedDocuments.length === 0 ? 0.6 : 1}}
                    >
                        Enviar selección ({selectedDocuments.length})
                    </button>

                    <div className="documents-table-wrapper">
                        {isLoading ? (
                            <p style={{textAlign:'center', padding: 20}}>Cargando documentos...</p>
                        ) : (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-column">
                                            <input 
                                                type="checkbox" 
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                disabled={currentDocuments.length === 0}
                                            />
                                        </th>
                                        <th>ID</th>
                                        <th>NOMBRE - ENTIDAD</th>
                                        <th onClick={() => handleSort('date')} style={{cursor: 'pointer', userSelect: 'none'}}>
                                            {dateHeaderLabel} {getSortIndicator('date')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentDocuments.length > 0 ? (
                                        currentDocuments.map(doc => (
                                            <tr key={doc.id} className={selectedDocuments.includes(doc.id) ? 'selected-row' : ''}>
                                                <td className="checkbox-column">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onChange={() => handleSelectDocument(doc.id)}
                                                    />
                                                </td>
                                                <td>{doc.id}</td>
                                                <td>{doc.type} - {doc.company}</td>
                                                <td>{formatDate(doc.date)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{textAlign:'center', padding: 20}}>
                                                No se encontraron documentos con estos filtros.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- CONTROLES DE PAGINACIÓN --- */}
                {totalPages > 1 && (
                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                        <button 
                            onClick={() => goToPage(currentPage - 1)} 
                            disabled={currentPage === 1} 
                            className="pagination-button"
                            style={{ padding: '8px 16px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            Anterior
                        </button>
                        
                        <span style={{ fontWeight: 'bold' }}>
                            Página {currentPage} de {totalPages}
                        </span>
                        
                        <button 
                            onClick={() => goToPage(currentPage + 1)} 
                            disabled={currentPage === totalPages} 
                            className="pagination-button"
                            style={{ padding: '8px 16px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL DE ENVÍO */}
            <SendDocumentModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                selectedDocuments={selectedDocuments}
                selectedDocumentNames={selectedDocuments.map(id => {
                    const doc = allDocuments.find(d => d.id === id);
                    return doc ? `${doc.type} - ${doc.company}` : `Documento #${id}`;
                })} 
                onSend={onConfirmSend}
                isLoading={isLoading}
            />
        </LayoutBase>
    );
};

export default SendDocuments;