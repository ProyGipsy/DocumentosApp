import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import SendDocumentModal from './SendDocumentModal';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 10;

const SendDocuments = () => {
    const [allDocuments, setAllDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [secondaryFilterOptions, setSecondaryFilterOptions] = useState([]);

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    
    // --- 1. CARGA DE DATOS REALES ---
    useEffect(() => {
        const fetchAllDocuments = async () => {
            setIsLoading(true);
            try {
                // LLAMADA AL BACKEND:
                // Necesitamos un endpoint que traiga TODO. 
                // Si no tienes uno específico, usa getDocumentsList sin params si tu backend lo soporta,
                // o crea uno nuevo: /documents/getAllDocuments
                const response = await fetch(`${apiUrl}/documents/getAllDocumentsList`);
                
                if (!response.ok) throw new Error('Error al cargar documentos');

                const data = await response.json();

                // Mapeo de datos (Ajusta las claves según tu SQL)
                const formattedDocs = data.map(doc => ({
                    id: doc.DocumentID, 
                    name: `Documento #${doc.DocumentID}`, // O doc.Name si existe columna
                    type: doc.TypeName, // Necesitas hacer JOIN con DocumentType en SQL
                    company: doc.CompanyName, // Necesitas hacer JOIN con Company en SQL
                    date: doc.AnnexDate // O doc.AnnexDate
                }));

                setAllDocuments(formattedDocs);
                setFilteredDocuments(formattedDocs);

            } catch (error) {
                console.error("Error:", error);
                // Fallback a datos vacíos o mensaje de error
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDocuments();
    }, []);

    // --- 2. Lógica de Filtrado (Igual que antes, solo ajustada a datos reales) ---
    useEffect(() => {
        let currentDocuments = [...allDocuments];
    
        if (searchTerm) {
            currentDocuments = currentDocuments.filter(doc =>
                doc.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    
        let newSecondaryOptions = [];
        if (primaryFilter === 'year') {
            const years = [...new Set(currentDocuments
                .filter(d => d.date)
                .map(d => new Date(d.date).getFullYear())
            )].sort((a, b) => b - a);
            newSecondaryOptions = years.map(year => ({ value: String(year), label: String(year) }));
        } else if (primaryFilter === 'company') {
            const companies = [...new Set(currentDocuments.map(d => d.company))].sort();
            newSecondaryOptions = companies.map(company => ({ value: company, label: company }));
        } else if (primaryFilter === 'type') {
            const types = [...new Set(currentDocuments.map(d => d.type))].sort();
            newSecondaryOptions = types.map(type => ({ value: type, label: type }));
        }
        setSecondaryFilterOptions(newSecondaryOptions);
    
        if (primaryFilter && secondaryFilter && !newSecondaryOptions.some(opt => opt.value === secondaryFilter)) {
            setSecondaryFilter('');
        }
    
        if (primaryFilter && secondaryFilter) {
            if (primaryFilter === 'year') {
                currentDocuments = currentDocuments.filter(doc =>
                    doc.date && String(new Date(doc.date).getFullYear()) === secondaryFilter
                );
            } else if (primaryFilter === 'company') {
                currentDocuments = currentDocuments.filter(doc =>
                    doc.company === secondaryFilter
                );
            } else if (primaryFilter === 'type') {
                currentDocuments = currentDocuments.filter(doc =>
                    doc.type === secondaryFilter
                );
            }
        }
        
        setFilteredDocuments(currentDocuments);
    }, [searchTerm, primaryFilter, secondaryFilter, allDocuments]);
    

    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredDocuments.slice(startIndex, endIndex);
    }, [filteredDocuments, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredDocuments.length]);

    // --- Lógica de Selección --- (Sin cambios mayores)
    const isAllSelected = paginatedDocuments.length > 0 && 
                          paginatedDocuments.every(doc => selectedDocuments.includes(doc.id));

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            const newSelected = new Set(selectedDocuments);
            paginatedDocuments.forEach(doc => newSelected.add(doc.id));
            setSelectedDocuments(Array.from(newSelected));
        } else {
            const paginatedIds = paginatedDocuments.map(doc => doc.id);
            const newSelected = selectedDocuments.filter(id => !paginatedIds.includes(id));
            setSelectedDocuments(newSelected);
        }
    };

    const handleSelectDocument = (docId) => {
        setSelectedDocuments(prev => 
            prev.includes(docId) 
                ? prev.filter(id => id !== docId) 
                : [...prev, docId]
        );
    };

    const handleSendSelection = () => {
        if (selectedDocuments.length === 0) {
            alert('Por favor, selecciona al menos un documento para enviar.');
            return;
        }
        setIsSendModalOpen(true);
    };

    // --- 3. Lógica de Envío al Backend ---
    const onConfirmSend = async (ids, companyId, message) => { // companyId acá se refiere al destinatario (Empresa externa)
        console.log(`Enviando ${ids.length} documentos...`);
        
        try {
            const payload = {
                documentIds: ids,
                recipientCompanyId: companyId, // ID de la empresa a la que envías
                emailMessage: message
            };

            const response = await fetch(`${apiUrl}/documents/sendDocuments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error en el envío');

            alert('Documentos enviados exitosamente.');
            setSelectedDocuments([]); // Limpiar selección

        } catch (error) {
            console.error("Error al enviar:", error);
            alert(`Hubo un problema al enviar: ${error.message}`);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <LayoutBase activePage="sendDocuments">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Envío de Documentos</h2>
                <br></br>
                
                {isLoading && <p>Cargando documentos...</p>}

                {/* Barra de Búsqueda y Filtro (Igual que antes) */}
                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style send-documents-layout">
                        <input
                            type="text"
                            placeholder="Buscar por Nombre..."
                            className="search-input-doc-list-sendDocuments"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            className="filter-select-admin"
                            value={primaryFilter}
                            onChange={(e) => {
                                setPrimaryFilter(e.target.value);
                                setSecondaryFilter('');
                            }}
                        >
                            <option value="">Filtrar por...</option>
                            <option value="year">Año</option>
                            <option value="company">Empresa</option>
                            <option value="type">Tipo de Documento</option>
                        </select>

                        {primaryFilter && secondaryFilterOptions.length > 0 && (
                            <select
                                className="filter-select-admin"
                                value={secondaryFilter}
                                onChange={(e) => setSecondaryFilter(e.target.value)}
                            >
                                <option value="">Seleccione...</option>
                                {secondaryFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                
                {/* Acciones y Tabla */}
                <div className="send-action-and-table-container">
                    <button 
                        className="send-selection-button" 
                        onClick={handleSendSelection}
                        disabled={selectedDocuments.length === 0}
                    >
                        Enviar selección ({selectedDocuments.length})
                    </button>

                    <div className="documents-table-wrapper">
                        {paginatedDocuments.length > 0 ? (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-column">
                                            <input 
                                                type="checkbox" 
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>NOMBRE</th>
                                        <th>TIPO</th>
                                        <th>EMPRESA</th>
                                        <th>FECHA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDocuments.map(doc => (
                                        <tr key={doc.id} className={selectedDocuments.includes(doc.id) ? 'selected-row' : ''}>
                                            <td className="checkbox-column">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedDocuments.includes(doc.id)}
                                                    onChange={() => handleSelectDocument(doc.id)}
                                                />
                                            </td>
                                            <td>{doc.name}</td>
                                            <td>{doc.type}</td>
                                            <td>{doc.company}</td>
                                            {/* Formato de fecha simple */}
                                            <td>{doc.date ? new Date(doc.date).toLocaleDateString('es-ES') : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-documents">No se encontraron documentos.</p>
                        )}
                    </div>
                </div>

                {/* Paginación (Igual que antes) */}
                {filteredDocuments.length > ITEMS_PER_PAGE && (
                    <div className="pagination-controls">
                        {/* ... botones de paginación ... */}
                        {/* Puedes copiar el bloque de paginación de tu código original aquí, es idéntico */}
                         <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">Anterior</button>
                         <span>Página {currentPage} de {totalPages}</span>
                         <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">Siguiente</button>
                    </div>
                )}
            </div>

            <SendDocumentModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                selectedDocuments={selectedDocuments}
                selectedDocumentNames={allDocuments
                    .filter(d => selectedDocuments.includes(d.id))
                    .map(d => d.name)}
                onSend={onConfirmSend}
            />
        </LayoutBase>
    );
};

export default SendDocuments;