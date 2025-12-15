import React, { useState, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import SendDocumentModal from './SendDocumentModal';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 20;

const SendDocuments = ({ folderId, folderName }) => {
    // --- ESTADOS DE DATOS ---
    const [allDocuments, setAllDocuments] = useState([]); // Aquí guardaremos los 186 documentos
    const [filteredDocuments, setFilteredDocuments] = useState([]); // Aquí los filtrados por empresa/año
    
    // --- ESTADOS DE UI ---
    const [isLoading, setIsLoading] = useState(false);
    const [dateHeaderLabel, setDateHeaderLabel] = useState('FECHA');
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    
    // --- ESTADOS DE FILTROS ---
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [companyOptions, setCompanyOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    // --- ESTADOS DE PAGINACIÓN Y SELECCIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

    // --- 1. CARGA DE TODOS LOS DATOS (FIX PARA OBTENER TODO DE GOLPE) ---
    useEffect(() => {
        const fetchAllDocuments = async () => {
            setIsLoading(true);
            try {
                // TRUCO: Pedimos pageSize=10000 para anular la paginación del backend
                // y forzar que nos envíe TODOS los documentos para paginarlos aquí en React.
                const params = new URLSearchParams({
                    page: 1,
                    pageSize: 10000 
                });

                // Si estás filtrando por carpeta (TypeID)
                if (folderId) {
                     // Ajusta 'typeId' según lo que espere tu backend, o usa params.append si es el mismo endpoint
                     // Si tu backend filtra por carpeta vía query param:
                     // params.append('typeId', folderId); 
                     
                     // O si tu backend usa una ruta distinta:
                     // url = `${apiUrl}/documents/getDocumentByTypeId?id=${folderId}`;
                }

                // Usamos el endpoint optimizado
                const response = await fetch(`${apiUrl}/documents/getAllDocumentsList?${params.toString()}`);
                
                if (!response.ok) throw new Error('Error al cargar documentos');
                
                const result = await response.json();
                
                // Tu backend devuelve { data: [...], total: ... } o directamente el array
                const dataList = Array.isArray(result) ? result : (result.data || []);

                console.log(`Documentos cargados: ${dataList.length}`); // Debug: Debería decir 186

                // Mapeo inicial
                const formattedDocs = dataList.map(doc => ({
                    id: doc.DocumentID || doc.id,
                    name: `Documento #${doc.DocumentID || doc.id}`,
                    type: doc.TypeName || doc.docTypeName || 'Sin Tipo',
                    company: doc.CompanyName || doc.companyName || 'Sin Empresa',
                    // Importante: El SQL optimizado devuelve ExpirationDate
                    date: doc.ExpirationDate || doc.AnnexDate || null 
                }));

                setAllDocuments(formattedDocs);
                setFilteredDocuments(formattedDocs);

                // Determinar etiqueta de fecha
                const anyHasExpiration = formattedDocs.some(fd => !!fd.date);
                setDateHeaderLabel(anyHasExpiration ? 'VENCIMIENTO' : 'FECHA');

                // --- GENERAR OPCIONES DE FILTRO (Dinámico basado en los 186 docs) ---
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

    // --- 2. LÓGICA DE FILTRADO (CLIENTE) ---
    useEffect(() => {
        let result = [...allDocuments];

        // Filtro por Empresa
        if (selectedCompany) {
            result = result.filter(doc => doc.company === selectedCompany);
        }

        // Filtro por Año
        if (selectedYear) {
            result = result.filter(doc => {
                if (!doc.date) return false;
                const docYear = new Date(doc.date).getFullYear();
                return docYear.toString() === selectedYear.toString();
            });
        }

        // Ordenamiento global antes de paginar
        if (sortConfig.key === 'date' && sortConfig.direction !== 'none') {
            result.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }

        setFilteredDocuments(result);
        setCurrentPage(1); // Resetear a página 1 al filtrar
    }, [selectedCompany, selectedYear, allDocuments, sortConfig]);

    // --- 3. PAGINACIÓN (CLIENTE - CORTAR EL ARRAY) ---
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    
    // Aquí es donde "cortamos" los 186 documentos en trozos de 20
    const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
    
    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

    // --- HELPERS ---
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
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // --- SELECCIÓN ---
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
                body: JSON.stringify({ documentIds: ids, emailData })
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

                {/* --- FILTROS --- */}
                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style send-documents-layout">
                        {/* Filtro Empresa */}
                        <select
                            className="filter-select-admin"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="">Todas las Empresas</option>
                            {companyOptions.map((comp, idx) => (
                                <option key={idx} value={comp}>{comp}</option>
                            ))}
                        </select>

                        {/* Filtro Año */}
                        <select
                            className="filter-select-admin"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">Todos los Años</option>
                            {yearOptions.map((year, idx) => (
                                <option key={idx} value={year}>{year}</option>
                            ))}
                        </select>
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
                                        <th>NOMBRE - EMPRESA</th>
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
                    // Buscamos en allDocuments para tener el nombre correcto aunque cambiemos de página
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