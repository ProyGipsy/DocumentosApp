import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import eyeIcon from '../../assets/img/eye.png';
import editIcon from '../../assets/img/edit.png';
import '../../styles/general/documentList.css';

// Datos simulados para la tabla de documentos
const mockDocuments = [
    { id: 1, name: 'Documento 1', company: 'Empresa Alpha', date: '01/03/2024' },
    { id: 2, name: 'Documento 2', company: 'Empresa Beta', date: '15/03/2023' },
    { id: 3, name: 'Documento 3', company: 'Empresa Alpha', date: '20/04/2024' },
    { id: 4, name: 'Documento 4', company: 'Empresa Delta', date: '10/05/2023' },
    { id: 5, name: 'Documento 5', company: 'Empresa Beta', date: '25/05/2024' },
    { id: 6, name: 'Documento 6', company: 'Empresa Alpha', date: '05/01/2024' },
];

const DocumentList = ({ folderName }) => {
    const [allDocuments] = useState(mockDocuments); // Fuente de datos completa
    const [searchTerm, setSearchTerm] = useState('');
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
            } else if (primaryFilter === 'month') {
                currentDocuments = currentDocuments.filter(doc =>
                    String(new Date(doc.date).getMonth()) === secondaryFilter
                );
            } else if (primaryFilter === 'company') {
                currentDocuments = currentDocuments.filter(doc =>
                    doc.company === secondaryFilter
                );
            }
        }
        
        // 5. Actualizar filtros
        setFilteredDocuments(currentDocuments);
    }, [searchTerm, primaryFilter, secondaryFilter, allDocuments]);


    const handleAddDocument = () => {
        alert('Llevar a interfaz de Crear Documento, marcando el tipo de documento según la carpeta actual.');
    };

    const handleViewDocument = (docId) => {
        alert(`Abrir modal para ver detalles del documento ID: ${docId}`);
    };

    const handleEditDocument = (docId) => {
        alert(`Llevar a interfaz de Crear Documento, rellenando los campos con la información actual. Cambiar título y botón.`);
    };

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="document-list-container">
                {/* Título de la Carpeta */}
                <h2 className="folder-title">{folderName}</h2>
                
                {/* Breadcrumb de Navegación */}
                <div className="breadcrumb">
                    <span className="breadcrumb-item">
                        <Link to="/" className="breadcrumb-link">
                            Inicio
                        </Link>
                    </span> 
                    <span className="breadcrumb-separator"> / </span>
                    <span className="breadcrumb-item active">{folderName}</span>
                </div>

                {/* Barra de Búsqueda y Filtro */}
                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style">
                        
                        <input
                            type="text"
                            placeholder="Buscar por Nombre del Documento..."
                            className="search-input-doc-list search-input-admin"
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

                {/* Botón de Agregar Documento */}
                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddDocument}>
                        + Agregar documento
                    </button>
                </div>

                {/* Tabla de Documentos */}
                <div className="documents-table-wrapper">
                    {filteredDocuments.length > 0 ? (
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>NOMBRE</th>
                                    <th>EMPRESA</th>
                                    <th>FECHA</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.map(doc => (
                                    <tr key={doc.id}>
                                        <td>{doc.name}</td>
                                        <td>{doc.company}</td>
                                        <td>{doc.date}</td>
                                        <td className="actions-cell">
                                            <button 
                                                className="view-button" 
                                                onClick={() => handleViewDocument(doc.id)}
                                                title="Ver Documento"
                                            >
                                                <img src={eyeIcon} alt="Ver" />
                                            </button>
                                            <button 
                                                className="view-button" 
                                                onClick={() => handleEditDocument(doc.id)}
                                                title="Editar Documento"
                                            >
                                                <img src={editIcon} alt="Editar" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-documents">No se encontraron documentos.</p>
                    )}
                </div>
            </div>
        </LayoutBaseAdmin>
    );
};

export default DocumentList;