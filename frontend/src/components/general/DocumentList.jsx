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
    const { folderId: locFolderId, folderName: locFolderName } = location.state || {};
    
    // --- CORRECCIÓN 1: Unificar Props y State ---
    // Damos prioridad a las props, si no existen, usamos el state de la navegación
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

    // 1. FETCH INICIAL: Obtener documentos por ID
    useEffect(() => {
        const fetchDocuments = async () => {
            // Usamos las variables unificadas
            if (!activeFolderId) {
                console.warn("No hay ID de carpeta (folderId) para buscar documentos.");
                return;
            }
            
            setIsLoading(true);
            try {
                // --- CORRECCIÓN 2: Usar el ID activo ---
                const params = new URLSearchParams({ id: activeFolderId });
                
                console.log("Fetching documents for ID:", activeFolderId); // Debug
                
                const response = await fetch(`${apiUrl}/documents/getDocumentsList?${params.toString()}`);
                
                if (!response.ok) throw new Error('Error al obtener la lista de documentos');

                const data = await response.json();
                
                // Mapeamos la respuesta usando las claves correctas que verificamos antes
                const formattedDocs = data.map(doc => ({
                    id: doc.id,
                    name: `Documento #${doc.id}`,
                    company: doc.companyName,
                    // Prioridad a fecha anexo, sino creación
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

        // --- CORRECCIÓN 3: Ejecutar siempre que tengamos el ID ---
        if (activeFolderId) { 
            fetchDocuments();
        }
    }, [activeFolderId, activeFolderName]); // Dependencias actualizadas

    // 2. LÓGICA DE FILTRADO (Igual que antes)
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
            // Validación para evitar error si date es nulo o inválido
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

            navigate('/document-create', { 
                state: { 
                    docId: docId, 
                    mode: mode, 
                    // Pasamos también el folderId para poder volver atrás correctamente si fuera necesario
                    folderId: activeFolderId, 
                    folderName: activeFolderName,
                    documentDetails: {
                        docId: fullDocData.DocumentID, // ID importante para editar
                        docTypeId: fullDocData.TypeID,
                        docTypeName: activeFolderName, 
                        companyId: fullDocData.CompanyID,
                        companyName: fullDocData.CompanyName,
                        attachment: fullDocData.AnnexURL ? fullDocData.AnnexURL.split('/').pop() : '',
                        fieldsData: fullDocData.fieldsData, 
                        annexUrl: fullDocData.AnnexURL 
                    } 
                } 
            });

        } catch (error) {
            console.error("Error obteniendo detalle:", error);
            alert("Error al cargar los detalles del documento.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDocument = () => {
        navigate('/document-create', { 
            state: { folderName: activeFolderName, mode: 'create' }
        });
    };

/*
    const handleViewDocument = (docId) => fetchAndNavigate(docId, 'view');
    const handleEditDocument = (docId) => fetchAndNavigate(docId, 'edit');
*/

    const handleViewDocument = (docId) => { alert('Visualización de Documento en desarrollo') }
    const handleEditDocument = (docId) => { alert('Edición de Documento en desarrollo') }
    
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        // Manejo seguro de fechas
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

                {/* Barra de Búsqueda y Filtro */}
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

                {/* Botón Agregar */}
                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddDocument}>
                        + Agregar documento
                    </button>
                </div>

                {/* Tabla */}
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