import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/SendDocuments.css'; 

// Datos simulados para la tabla (similares a los del diseño)
const mockDocuments = [
    { id: 1, name: 'Contrato A-2024', type: 'Arrendamiento', company: 'Gipsy S.A.', date: '01/03/2024' },
    { id: 2, name: 'RIF GIPSY 2024', type: 'RIF', company: 'Gipsy S.A.', date: '15/03/2023' },
    { id: 3, name: 'Poder Legal', type: 'Poderes', company: 'Empresa Beta', date: '20/04/2024' },
    { id: 4, name: 'Licencia Sanitaria', type: 'Permiso Sanitario', company: 'Empresa Delta', date: '10/05/2023' },
    { id: 5, name: 'Estatuto Registral', type: 'Registros Mercantiles', company: 'Empresa Beta', date: '25/05/2024' },
    { id: 6, name: 'Patente Municipal', type: 'Patente', company: 'Gipsy S.A.', date: '05/01/2024' },
    { id: 7, name: 'Recibo CORPOELEC', type: 'Corpoelec', company: 'Empresa Alpha', date: '10/06/2024' },
    { id: 8, name: 'Póliza Vehículo', type: 'Pólizas Seguro', company: 'Empresa Delta', date: '25/06/2024' },
    { id: 9, name: 'Registro Sanitario', type: 'Registro Sanitario', company: 'Gipsy S.A.', date: '01/07/2024' },
    { id: 10, name: 'Acta de Asamblea', type: 'Registros Mercantiles', company: 'Empresa Alpha', date: '15/07/2024' },
    // Página 2
    { id: 11, name: 'Factura 11', type: 'Factura', company: 'Gipsy S.A.', date: '01/08/2024' },
    { id: 12, name: 'Factura 12', type: 'Factura', company: 'Empresa Beta', date: '15/08/2024' },
];

const ITEMS_PER_PAGE = 10; // Límite de documentos por página

const SendDocuments = () => {
    const [allDocuments] = useState(mockDocuments);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filteredDocuments, setFilteredDocuments] = useState(allDocuments);
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [secondaryFilterOptions, setSecondaryFilterOptions] = useState([]);
    
    // Lógica de Filtrado y Opciones Dinámicas
    useEffect(() => {
        let currentDocuments = [...allDocuments];
    
        // 1. Barra de búsqueda
        if (searchTerm) {
            currentDocuments = currentDocuments.filter(doc =>
                doc.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    
        // 2. Opciones del filtro secundario
        let newSecondaryOptions = [];
        if (primaryFilter === 'year') {
            const years = [...new Set(currentDocuments.map(d => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
            newSecondaryOptions = years.map(year => ({ value: String(year), label: String(year) }));
        } else if (primaryFilter === 'company') {
            const companies = [...new Set(currentDocuments.map(d => d.company))].sort();
            newSecondaryOptions = companies.map(company => ({ value: company, label: company }));
        } else if (primaryFilter === 'type') { // 💡 AJUSTE 3: Lógica para Tipo de Documento
            const types = [...new Set(currentDocuments.map(d => d.type))].sort();
            newSecondaryOptions = types.map(type => ({ value: type, label: type }));
        }
        setSecondaryFilterOptions(newSecondaryOptions);
    
        // 3. Limpieza de filtro secundario
        if (primaryFilter !== '' && secondaryFilter !== '' && !newSecondaryOptions.some(opt => opt.value === secondaryFilter)) {
            setSecondaryFilter('');
        } else if (primaryFilter === '' && secondaryFilter !== '') {
            setSecondaryFilter('');
        }
    
        // 4. Filtro secundario
        if (primaryFilter && secondaryFilter !== '') {
            if (primaryFilter === 'year') {
                currentDocuments = currentDocuments.filter(doc =>
                    String(new Date(doc.date).getFullYear()) === secondaryFilter
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
        
        // 5. Actualizar filtros
        setFilteredDocuments(currentDocuments);
    }, [searchTerm, primaryFilter, secondaryFilter, allDocuments]);
    

    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

    const paginatedDocuments = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredDocuments.slice(startIndex, endIndex);
    }, [filteredDocuments, currentPage]);

    useEffect(() => {
        // Reiniciar a la primera página cuando cambian los filtros/búsqueda
        setCurrentPage(1);
    }, [searchTerm, filteredDocuments.length]);

    // --- Lógica de Selección de Checkbox ---

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
            const newSelected = selectedDocuments.filter(id => 
                !paginatedIds.includes(id)
            );
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
        alert(`Enviar documentos seleccionados: ${selectedDocuments.join(', ')}`);
    };

    // --- Lógica de Paginación ---

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <LayoutBase activePage="sendDocuments">
            <div className="document-list-container">
                <h2 className="folder-title-sendDocuments">Envío de Documentos</h2>
                <br></br>
                
                {/* Barra de Búsqueda y Filtro */}
                <div className="search-and-controls">
                    {/* Usamos la clase send-documents-layout que será modificada para centrar */}
                    <div className="search-filter-group users-table-style send-documents-layout">
                        <input
                            type="text"
                            placeholder="Buscar por Nombre del Documento..."
                            className="search-input-doc-list-sendDocuments"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {/* Filtro primario */}
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
                            <option value="type">Tipo de Documento</option> {/* 💡 AJUSTE 3: Nueva opción */}
                        </select>

                        {/* Filtro secundario dinámico */}
                        {primaryFilter && secondaryFilterOptions.length > 0 && (
                            <select
                                className="filter-select-admin"
                                value={secondaryFilter}
                                onChange={(e) => setSecondaryFilter(e.target.value)}
                                disabled={secondaryFilterOptions.length === 0}
                            >
                                <option value="">
                                    {primaryFilter === 'year' && 'Seleccione un año'}
                                    {primaryFilter === 'company' && 'Seleccione una empresa'}
                                    {primaryFilter === 'type' && 'Seleccione un tipo'} {/* 💡 AJUSTE 3: Nuevo placeholder */}
                                </option>
                                {secondaryFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                
                {/* Botón de Acción Principal y Tabla */}
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
                                        {/* Checkbox de selección masiva */}
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
                                            {/* Checkbox individual */}
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
                                            <td>{doc.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-documents">No se encontraron documentos.</p>
                        )}
                    </div>
                </div>

                {/* Paginación */}
                {filteredDocuments.length > ITEMS_PER_PAGE && (
                    <div className="pagination-controls">
                        <button 
                            onClick={() => goToPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Anterior
                        </button>
                        <div className="page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`page-number-button ${currentPage === page ? 'active' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => goToPage(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </LayoutBase>
    );
};

export default SendDocuments;