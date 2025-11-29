import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import eyeIcon from '../../assets/img/eye.png';
import editIcon from '../../assets/img/edit.png';
import '../../styles/general/documentList.css';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const DocumentList = ({ folderId, folderName }) => {
    const location = useLocation();
    // Prioridad a props, luego estado de navegación
    const { folderId: locFolderId, folderName: locFolderName } = location.state || {};
    const activeFolderId = folderId || locFolderId;
    const activeFolderName = folderName || locFolderName;

    const [allDocuments, setAllDocuments] = useState([]); 
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [secondaryFilterOptions, setSecondaryFilterOptions] = useState([]);
    
    const navigate = useNavigate();

    // 1. FETCH INICIAL
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!activeFolderId) return;
            
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ id: activeFolderId });
                const response = await fetch(`${apiUrl}/documents/getDocumentsList?${params.toString()}`);
                
                if (!response.ok) throw new Error('Error al obtener la lista de documentos');

                const data = await response.json();
                
                const formattedDocs = data.map(doc => ({
                    id: doc.id,
                    name: `Documento #${doc.id}`,
                    company: doc.companyName,
                    date: doc.annexDate || doc.creationDate, 
                    docTypeId: doc.typeId,
                    docTypeName: doc.docTypeName || activeFolderName
                }));

                setAllDocuments(formattedDocs);
                setFilteredDocuments(formattedDocs);

            } catch (error) {
                console.error("Error cargando documentos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeFolderId) { 
            fetchDocuments();
        }
    }, [activeFolderId, activeFolderName]);

    // 2. LÓGICA DE FILTRADO (Sin cambios)
    useEffect(() => {
        let currentDocuments = [...allDocuments];

        if (searchTerm) {
            currentDocuments = currentDocuments.filter(doc =>
                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.company.toLowerCase().includes(searchTerm.toLowerCase())
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
            }
        }
        
        setFilteredDocuments(currentDocuments);
    }, [searchTerm, primaryFilter, secondaryFilter, allDocuments]);


    // 3. FETCH DE DETALLES Y NAVEGACIÓN
    const fetchAndNavigate = async (docId, mode) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/documents/getDocument?id=${docId}`);
            
            if (!response.ok) throw new Error('No se pudo obtener el detalle del documento');
            
            const fullDocData = await response.json();

            // Extraer nombre del archivo si existe URL
            let fileName = '';
            if (fullDocData.AnnexURL) {
                fileName = fullDocData.AnnexURL.split('/').pop();
                try { fileName = decodeURIComponent(fileName); } catch (e) {} 
            }

            // Construir objeto de detalles robusto
            const docDetailsForNav = {
                docId: fullDocData.DocumentID, // ID del documento
                docTypeId: fullDocData.TypeID, // ID del tipo
                docTypeName: fullDocData.TypeName || activeFolderName, 
                companyId: fullDocData.CompanyID,
                companyName: fullDocData.CompanyName,
                attachment: fileName,
                fieldsData: fullDocData.fieldsData || {}, // Asegurar objeto
                annexUrl: fullDocData.AnnexURL 
            };

            console.log("Navegando con detalles:", docDetailsForNav); // Debug

            navigate('/document-create', { 
                state: { 
                    docId: docId, 
                    mode: mode, 
                    folderId: activeFolderId, 
                    folderName: activeFolderName,
                    documentDetails: docDetailsForNav
                } 
            });

        } catch (error) {
            console.error("Error obteniendo detalle:", error);
            alert("Error al cargar los detalles del documento para editar/ver.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDocument = () => {
        navigate('/document-create', { 
            state: { folderName: activeFolderName, folderId: activeFolderId, mode: 'create' }
        });
    };

    // Funciones wrapper
    const handleViewDocument = (docId) => fetchAndNavigate(docId, 'view');
    const handleEditDocument = (docId) => fetchAndNavigate(docId, 'edit');

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES');
    };

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="document-list-container">
                <h2 className="folder-title">{activeFolderName || 'Documentos'}</h2>
                
                <div className="breadcrumb">
                    <span className="breadcrumb-item">
                        <Link to="/" className="breadcrumb-link">Inicio</Link>
                    </span> 
                    <span className="breadcrumb-separator"> / </span>
                    <span className="breadcrumb-item active">{activeFolderName || 'Lista'}</span>
                </div>

                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style">
                        <input
                            type="text"
                            placeholder="Buscar por Nombre o Empresa..."
                            className="search-input-doc-list search-input-admin"
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

                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddDocument}>
                        + Agregar documento
                    </button>
                </div>

                <div className="documents-table-wrapper">
                    {isLoading && allDocuments.length === 0 ? (
                        <p style={{textAlign: 'center', padding: '20px'}}>Cargando documentos...</p>
                    ) : filteredDocuments.length > 0 ? (
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
                                        <td>{formatDate(doc.date)}</td>
                                        <td className="actions-cell">
                                            <button 
                                                className="view-button" 
                                                onClick={() => handleViewDocument(doc.id)}
                                                title="Ver Documento"
                                                disabled={isLoading} 
                                            >
                                                <img src={eyeIcon} alt="Ver" />
                                            </button>
                                            <button 
                                                className="view-button" 
                                                onClick={() => handleEditDocument(doc.id)}
                                                title="Editar Documento"
                                                disabled={isLoading} 
                                            >
                                                <img src={editIcon} alt="Editar" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-documents">No se encontraron documentos en esta carpeta.</p>
                    )}
                </div>
            </div>
        </LayoutBaseAdmin>
    );
};

export default DocumentList;