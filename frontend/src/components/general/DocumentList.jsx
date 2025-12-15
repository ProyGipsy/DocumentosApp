import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import eyeIcon from '../../assets/img/eye.png';
import editIcon from '../../assets/img/edit.png';
import '../../styles/general/documentList.css';
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
    const [dateHeaderLabel, setDateHeaderLabel] = useState('FECHA');
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [secondaryFilterOptions, setSecondaryFilterOptions] = useState([]);
    
    const navigate = useNavigate();
    const { user } = useAuth();
    const hasRole = (roleId) => {
        if (!user) return false;
        return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
    };
    const isEditor = hasRole(11);
    const isLector = hasRole(12);
    const isOnlyLector = isLector && !isEditor;

    // --- ESTADOS PARA EL MODAL LOCAL (VER/EDITAR) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
    
    // Datos que necesita el modal para renderizarse
    const [selectedDocDetails, setSelectedDocDetails] = useState(null);     // Valores del documento
    const [selectedDocTypeStruct, setSelectedDocTypeStruct] = useState(null); // Estructura de campos
    const [selectedCompany, setSelectedCompany] = useState(null);           // Info de la empresa

    // 1. FETCH INICIAL: Obtener lista de documentos
    const fetchDocumentsList = async () => {
        if (!activeFolderId) return;
        
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ id: activeFolderId });
            const response = await fetch(`${apiUrl}/documents/getDocumentByTypeId?${params.toString()}`);
            
            if (!response.ok) throw new Error('Error al obtener la lista de documentos');

            const data = await response.json();

            const extractExpiration = (docData) => {
                if (!docData) return null;
                const fields = docData.fieldsData || docData.fields || null;

                const normalize = (s) => (s || '').toString().trim().toLowerCase();

                const checkAndReturn = (name, value) => {
                    if (!value && value !== 0) return null;
                    const v = value;
                    // Si es un string YYYY-MM-DD, devolvemos tal cual (fecha sin timezone)
                    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
                        return v.trim();
                    }

                    // Si se puede parsear, devolvemos en formato YYYY-MM-DD usando componentes locales
                    const date = new Date(v);
                    if (!isNaN(date.getTime())) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                    return null;
                };

                // Si fields es un objeto con claves = nombres de campo
                if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
                    for (const [k, v] of Object.entries(fields)) {
                        const key = normalize(k);
                        if (key.includes('vencim') || key.includes('fecha de venc')) {
                            // v podría ser un string o un objeto con Value
                            if (typeof v === 'object' && v !== null) {
                                const candidate = v.Value || v.value || v.valor || v.text || v.textValue || v.ValueText || v.valor_texto || null;
                                const res = checkAndReturn(k, candidate ?? v);
                                if (res) return res;
                            } else {
                                const res = checkAndReturn(k, v);
                                if (res) return res;
                            }
                        }
                    }
                }

                // Si fields es un array de objetos [{ name, value }, ...] o similar
                if (Array.isArray(fields)) {
                    for (const f of fields) {
                        const name = normalize(f.name || f.fieldName || f.label || f.labelName || f.FieldName);
                        if (name && (name.includes('vencim') || name.includes('fecha de venc'))) {
                            const candidate = f.value ?? f.Value ?? f.default ?? f.text ?? f.valueText ?? null;
                            const res = checkAndReturn(f.name || f.fieldName, candidate ?? f);
                            if (res) return res;
                        }
                    }
                }

                return null;
            };

            // Hacemos peticiones en paralelo (pero controladas) para obtener detalles y extraer vencimiento
            const detailsPromises = data.map(async (doc) => {
                try {
                    const docRes = await fetch(`${apiUrl}/documents/getDocument?id=${doc.id}`);
                    if (!docRes.ok) return { raw: doc, expiration: null };
                    const docData = await docRes.json();
                    const expiration = extractExpiration(docData);
                    return { raw: doc, expiration };
                } catch (err) {
                    return { raw: doc, expiration: null };
                }
            });

            const details = await Promise.all(detailsPromises);

            const formattedDocs = details.map(d => ({
                id: d.raw.id,
                name: `Documento #${d.raw.id}`,
                company: d.raw.companyName || d.raw.CompanyName || '',
                date: d.expiration || null,
                docTypeId: d.raw.typeId || d.raw.TypeID,
                docTypeName: d.raw.docTypeName || activeFolderName,
            }));

            // Si al menos uno tiene vencimiento, cambiamos el header a VENCIMIENTO
            const anyHasExpiration = formattedDocs.some(fd => !!fd.date);
            setDateHeaderLabel(anyHasExpiration ? 'VENCIMIENTO' : '');

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

    // 2. LÓGICA DE FILTRADO (Sin cambios)
    useEffect(() => {
        let currentDocuments = [...allDocuments];

        const getYear = (dateStr) => {
            if (!dateStr) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Number(dateStr.split('-')[0]);
            const dt = new Date(dateStr);
            return isNaN(dt.getTime()) ? null : dt.getFullYear();
        };

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
                .map(d => getYear(d.date))
                .filter(y => y !== null)
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
                currentDocuments = currentDocuments.filter(doc => {
                    const y = getYear(doc.date);
                    return y !== null && String(y) === secondaryFilter;
                });
            } else if (primaryFilter === 'company') {
                currentDocuments = currentDocuments.filter(doc =>
                    doc.company === secondaryFilter
                );
            }
        }

        // --- Aplicar ordenamiento si corresponde ---
        if (sortConfig.key === 'date' && sortConfig.direction !== 'none') {
            currentDocuments.sort((a, b) => {
                const parse = (s) => {
                    if (!s) return null;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                        const [y, m, d] = s.split('-').map(Number);
                        return new Date(y, m - 1, d).getTime();
                    }
                    const dt = new Date(s);
                    return isNaN(dt.getTime()) ? null : dt.getTime();
                };

                const dateA = parse(a.date);
                const dateB = parse(b.date);

                const isANull = dateA === null;
                const isBNull = dateB === null;

                if (isANull && isBNull) return 0;
                if (isANull) return sortConfig.direction === 'asc' ? 1 : -1;
                if (isBNull) return sortConfig.direction === 'asc' ? -1 : 1;

                if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredDocuments(currentDocuments);
    }, [searchTerm, primaryFilter, secondaryFilter, allDocuments, sortConfig]);

    // --- Manejador de ordenamiento para la columna de fecha ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = 'none';
                key = null;
            } else {
                direction = 'asc';
            }
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        if (sortConfig.direction === 'asc') return ' ▲';
        if (sortConfig.direction === 'desc') return ' ▼';
        return null;
    };


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
        if (!dateString) return ' ';

        // If date only in YYYY-MM-DD, build local Date to avoid timezone shift
        const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
        let date;
        if (dateOnlyMatch) {
            const [y, m, d] = dateString.split('-').map(Number);
            date = new Date(y, m - 1, d); // local midnight
        } else {
            date = new Date(dateString);
        }

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
                            placeholder="Buscar por Nombre o Entidad..."
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
                {!isOnlyLector && (
                    <div className="add-doc-button-container">
                        <button className="add-doc-button" onClick={handleAddDocument}>
                            + Agregar documento
                        </button>
                    </div>
                )}

                {/* Tabla */}
                <div className="documents-table-wrapper">
                    {/* Loader solo si el modal NO está abierto, para no parpadear el fondo */}
                    {isLoading && !isModalOpen && allDocuments.length === 0 ? (
                        <p style={{textAlign: 'center', padding: '20px'}}>Cargando documentos...</p>
                    ) : filteredDocuments.length > 0 ? (
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NOMBRE - EMPRESA</th>
                                    <th>
                                        <span
                                            onClick={() => handleSort('date')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            {dateHeaderLabel}
                                            {getSortIndicator('date')}
                                        </span>
                                    </th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.map(doc => (
                                    <tr key={doc.id}>
                                        <td>{doc.id}</td>
                                        <td>{activeFolderName} - {doc.company}</td>
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
                                            {!isOnlyLector && (
                                                <button 
                                                    className="view-button" 
                                                    onClick={() => handleEditDocument(doc.id)}
                                                    title="Editar Documento"
                                                >
                                                    <img src={editIcon} alt="Editar" />
                                                </button>
                                            )}
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