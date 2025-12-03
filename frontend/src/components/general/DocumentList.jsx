import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import eyeIcon from '../../assets/img/eye.png';
import editIcon from '../../assets/img/edit.png';
import '../../styles/general/documentList.css';

// --- IMPORTANTE: Importar el Modal ---
import DocumentFieldsModal from './DocumentFieldsModal';

// Configuración de API
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const DocumentList = ({ folderId, folderName }) => {
    const location = useLocation();
    // Prioridad a props (si viene del padre), luego estado de navegación (si viene del router)
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

    // --- ESTADOS PARA EL MODAL LOCAL (VER/EDITAR) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
    
    // Datos que necesita el modal para renderizarse
    const [selectedDocDetails, setSelectedDocDetails] = useState(null);     // Valores del documento
    const [selectedDocTypeStruct, setSelectedDocTypeStruct] = useState(null); // Estructura de campos
    const [selectedCompany, setSelectedCompany] = useState(null);           // Info de la empresa

    // ----------------------------------------------------
    // 1. FETCH INICIAL: Obtener lista de documentos
    // ----------------------------------------------------
    const fetchDocumentsList = async () => {
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

    useEffect(() => {
        if (activeFolderId) { 
            fetchDocumentsList();
        }
    }, [activeFolderId, activeFolderName]);

    // ----------------------------------------------------
    // 2. LÓGICA DE FILTRADO (Sin cambios)
    // ----------------------------------------------------
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


    // ----------------------------------------------------
    // 3. LÓGICA DE MODAL (NUEVO: Fetch Local y Apertura)
    // ----------------------------------------------------
    const handleOpenModal = async (docId, mode) => {
        setIsLoading(true);
        try {
            // PASO A: Obtener los datos del documento (Valores y Anexo)
            const docRes = await fetch(`${apiUrl}/documents/getDocument?id=${docId}`);
            if (!docRes.ok) throw new Error('Error al cargar documento');
            const docData = await docRes.json();

            // PASO B: Obtener la estructura del Tipo de Documento (Campos)
            // Usamos el TypeID que nos devolvió el documento para pedir su estructura
            const typeRes = await fetch(`${apiUrl}/documents/getDocTypeFull?id=${docData.TypeID}`);
            if (!typeRes.ok) throw new Error('Error al cargar definición de campos');
            const typeData = await typeRes.json();

            // PASO C: Guardar en estado y abrir
            setSelectedDocDetails(docData);      
            setSelectedDocTypeStruct(typeData);  
            setSelectedCompany({                 
                id: docData.CompanyID,
                name: docData.CompanyName
            });
            
            setModalMode(mode);
            setIsModalOpen(true);

        } catch (error) {
            console.error("Error abriendo documento:", error);
            alert("No se pudo cargar la información del documento.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDocument = (docId) => handleOpenModal(docId, 'view');
    const handleEditDocument = (docId) => handleOpenModal(docId, 'edit');

    // Callback para cuando el modal guarde cambios exitosamente
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setSelectedDocDetails(null);
        // Recargamos la lista por si cambió algo visible (ej: nombre de empresa, fecha)
        fetchDocumentsList(); 
    };

    // Para "Agregar", seguimos navegando a la pantalla de creación porque es un flujo de pasos
    const handleAddDocument = () => {
        navigate('/document-create', { 
            state: { folderName: activeFolderName, folderId: activeFolderId, mode: 'create' }
        });
    };

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
                    {/* Loader solo si el modal NO está abierto, para no parpadear el fondo */}
                    {isLoading && !isModalOpen && allDocuments.length === 0 ? (
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
                                                // No deshabilitamos con isLoading general para permitir clic rápido si ya cargó la lista
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
                        !isLoading && <p className="no-documents">No se encontraron documentos en esta carpeta.</p>
                    )}
                </div>
            </div>

            {/* --- RENDERIZADO DEL MODAL --- */}
            {isModalOpen && selectedDocTypeStruct && selectedCompany && (
                <DocumentFieldsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedDocDetails(null);
                    }}
                    company={selectedCompany}
                    documentType={selectedDocTypeStruct}
                    mode={modalMode}
                    
                    // Datos clave para la edición
                    documentId={selectedDocDetails.DocumentID}
                    initialFormData={selectedDocDetails.fieldsData || {}}
                    
                    // Extraer nombre limpio del archivo
                    initialAttachmentName={
                        selectedDocDetails.AnnexURL 
                        ? decodeURIComponent(selectedDocDetails.AnnexURL.split('/').pop()) 
                        : ''
                    }
                    
                    // Callback de éxito
                    onSaveDocument={handleSaveSuccess}
                    currentAnnexUrl={selectedDocDetails.AnnexURL}
                />
            )}

        </LayoutBaseAdmin>
    );
};

export default DocumentList;