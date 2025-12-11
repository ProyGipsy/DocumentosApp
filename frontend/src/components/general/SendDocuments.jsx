import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import SendDocumentModal from './SendDocumentModal';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 20;

const SendDocuments = ({ folderId, folderName }) => { // Recibe props opcionales
    const [allDocuments, setAllDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [secondaryFilterOptions, setSecondaryFilterOptions] = useState([]);

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    
    // --- 1. CARGA DE DATOS (FETCH) ---
    useEffect(() => {
        const fetchAllDocuments = async () => {
            setIsLoading(true);
            try {
                // LÓGICA DE ENDPOINT:
                // Si recibimos un folderId (props), filtramos por esa carpeta.
                // Si no (vista general), pedimos TODOS los documentos.
                let url = `${apiUrl}/documents/getAllDocumentsList`; 
                
                if (folderId) {
                    const params = new URLSearchParams({ id: folderId });
                    url = `${apiUrl}/documents/getDocumentsList?${params.toString()}`;
                }

                const response = await fetch(url);
                
                if (!response.ok) throw new Error('Error al cargar documentos');

                const data = await response.json();

                // Mapeo seguro de datos (Backend -> Frontend)
                const formattedDocs = data.map(doc => ({
                    id: doc.DocumentID || doc.id, 
                    name: `Documento #${doc.DocumentID || doc.id}`, // O doc.Name si existe
                    // Aseguramos que existan estos campos (si vienes de getAllDocuments deberían estar)
                    type: doc.TypeName || doc.docTypeName || 'Sin Tipo', 
                    company: doc.CompanyName || doc.companyName || 'Sin Empresa', 
                    date: doc.AnnexDate 
                }));

                setAllDocuments(formattedDocs);
                setFilteredDocuments(formattedDocs);

            } catch (error) {
                console.error("Error cargando documentos:", error);
                // Opcional: Mostrar alerta al usuario
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDocuments();
    }, [folderId]); // Dependencia: si cambia la carpeta, recargamos

    // --- 2. LÓGICA DE FILTRADO ---
    useEffect(() => {
        let currentDocuments = [...allDocuments];
    
        // A. Búsqueda por texto
        if (searchTerm) {
            currentDocuments = currentDocuments.filter(doc =>
                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    
        // B. Opciones del filtro secundario
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
    
        // C. Limpieza de filtro secundario
        if (primaryFilter && secondaryFilter && !newSecondaryOptions.some(opt => opt.value === secondaryFilter)) {
            setSecondaryFilter('');
        }
    
        // D. Aplicación de filtros
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
    

    // --- Paginación ---
    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredDocuments.slice(startIndex, endIndex);
    }, [filteredDocuments, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredDocuments.length]);


    // --- Lógica de Selección ---
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

    // --- 3. LÓGICA DE ENVÍO AL BACKEND (IMPLEMENTADA) ---
    const onConfirmSend = async (ids, emailData) => { 
        // Nota: emailData viene del modal con { senderName, recipientName, recipients, subject, body }
        
        console.log(`Enviando ${ids.length} documentos...`, emailData);
        setIsLoading(true);
        
        try {
            const payload = {
                documentIds: ids,
                emailData: emailData
            };

            const response = await fetch(`${apiUrl}/documents/sendDocuments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error en el envío');

            alert('¡Documentos enviados exitosamente por correo!');
            
            // Limpieza
            setSelectedDocuments([]); 
            setIsSendModalOpen(false);

        } catch (error) {
            console.error("Error al enviar:", error);
            alert(`Hubo un problema al enviar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES');
    };

    return (
        <LayoutBase activePage="sendDocuments">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Envío de Documentos</h2>
                <br></br>
                
                {isLoading && <p style={{textAlign:'center'}}>Procesando...</p>}

                {/* Filtros */}
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
                
                {/* Botón de Acción y Tabla */}
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
                                        <th>ID</th>
                                        <th>NOMBRE - EMPRESA</th>
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
                                            <td>{doc.id}</td>
                                            <td>{doc.type} - {doc.company}</td>
                                            <td>{formatDate(doc.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-documents">
                                {isLoading ? "Cargando..." : "No se encontraron documentos."}
                            </p>
                        )}
                    </div>
                </div>

                {/* Paginación */}
                {filteredDocuments.length > ITEMS_PER_PAGE && (
                    <div className="pagination-controls">
                         <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">Anterior</button>
                         <span>Página {currentPage} de {totalPages}</span>
                         <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">Siguiente</button>
                    </div>
                )}
            </div>

            {/* MODAL DE ENVÍO */}
            <SendDocumentModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                selectedDocuments={selectedDocuments}
                selectedDocumentNames={allDocuments
                    .filter(d => selectedDocuments.includes(d.id))
                    // CAMBIO A: d.type - d.company
                    .map(d => `${d.type} - ${d.company}`)} 
                onSend={onConfirmSend}
                isLoading={isLoading}
            />
        </LayoutBase>
    );
};

export default SendDocuments;