import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LayoutBase from '../base/LayoutBase'; 
import '../../styles/general/documentTypeForm.css'; 
import DocumentFieldsModal from './DocumentFieldsModal';
import SendDocumentModal from './SendDocumentModal';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- Tipos de Documentos con Campos Dinámicos ---
/*
const MOCK_DOCUMENT_TYPES = [
    {
        id: 'rif',
        name: 'Registro de Identificación Fiscal (RIF)',
        fields: [
            // Campo de Valores Específicos: Se convierte en un <select>
            { name: 'Prefijo RIF', typeId: 'specific-values', specificValues: ['V', 'J', 'G', 'E'] },
            // Campo de Número Entero: Se convierte en un <input type="number">
            { name: 'Número RIF', typeId: 'integer', length: 9 }, 
            { name: 'Razón Social', typeId: 'text-short', length: 100 },
            // Campo de Texto Largo: Se convierte en un <textarea>
            { name: 'Dirección Fiscal', typeId: 'text-long', length: 500 }, 
        ]
    },
    {
        id: 'invoice',
        name: 'Factura de Venta',
        fields: [
            { name: 'Número de Factura', typeId: 'text-short', length: 20 },
            { name: 'Fecha de Emisión', typeId: 'date' },
            // Campo de Número Decimal (con precisión 2): Se convierte en <input type="number" step="0.01">
            { name: 'Monto Neto', typeId: 'decimal', precision: 2 }, 
            { name: 'IVA (16%)', typeId: 'decimal', precision: 2 },
            { name: 'Método de Pago', typeId: 'specific-values', specificValues: ['Transferencia', 'Punto de Venta', 'Efectivo'] },
        ]
    },
    {
        id: 'hr-contract',
        name: 'Contrato Laboral',
        fields: [
            { name: 'Cédula de Identidad', typeId: 'integer', length: 8 },
            { name: 'Fecha de Ingreso', typeId: 'date' },
            { name: 'Puesto', typeId: 'text-short', length: 50 },
            { name: 'Salario Base', typeId: 'decimal', precision: 2 },
        ]
    }
];
*/

// --- Empresas Asociadas  ---
/*
const MOCK_COMPANIES = [
    { id: '1', name: 'ACME C.A.' },
    { id: '2', name: 'Gipsy Solutions' },
    { id: '3', name: 'Industrias Vega' },
];
*/

// Mapear nombre de carpeta a ID de Tipo de Documento
const getDocTypeIdFromFolderName = (folderName) => {
    const type = MOCK_DOCUMENT_TYPES.find(dt => 
        dt.name.toLowerCase().includes(folderName.toLowerCase()) || 
        folderName.toLowerCase().includes(dt.name.toLowerCase())
    );
    return type ? type.id : '';
};

const CreateDocumentForm = () => {

    const location = useLocation(); 
    const { folderName, docId, mode, documentDetails } = location.state || {};

    const [MOCK_DOCUMENT_TYPES, setMockDocumentTypes] = useState([]);
    const [MOCK_COMPANIES, setMockCompanies] = useState([]);

    const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [operationMode, setOperationMode] = useState(mode || 'create');

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [documentToSend, setDocumentToSend] = useState(null);

    // Título dinámico
    const formTitle = operationMode === 'view' 
        ? 'Visualización de Documento' 
        : operationMode === 'edit' 
        ? 'Edición de Documento' 
        : 'Creación de Documento';

    // Cargar los tipos de documentos y empresas desde el backend
    useEffect(() => {
        const fetchMockDocumentType = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${apiUrl}/documents/getDocType`);

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
                setMockDocumentTypes(data);
            } catch (err) {
                console.error('Error al obtener los tipos de documentos:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchMockCompanies = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${apiUrl}/documents/getDocCompanies`);

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
                setMockCompanies(data);
            } catch (err) {
                console.error('Error al obtener las empresas:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMockDocumentType();
        fetchMockCompanies();
    }, [])

    const currentDocType = useMemo(() => {
        return MOCK_DOCUMENT_TYPES.find(dt => dt.id === selectedDocTypeId);
    }, [selectedDocTypeId]);

    const currentCompany = useMemo(() => {
        return MOCK_COMPANIES.find(dt => dt.id === selectedCompanyId);
    }, [selectedCompanyId]);

    // useEffect para manejar la carga inicial de datos (pre-selección / edición / vista)
    useEffect(() => {
        if (mode === 'create' && folderName) {
            // Caso CREACIÓN con pre-selección
            const preSelectedId = getDocTypeIdFromFolderName(folderName);
            setSelectedDocTypeId(preSelectedId);
            setOperationMode('create');

        } else if (docId && (mode === 'view' || mode === 'edit') && documentDetails) {
            // Caso VER/EDITAR: Cargar datos y saltar selects
            setOperationMode(mode);
            setSelectedDocTypeId(documentDetails.docTypeId);
            
            // Busca la empresa por ID o nombre (si los mocks fueran inconsistentes)
            const companyMatch = MOCK_COMPANIES.find(c => c.id === documentDetails.companyId || c.name === documentDetails.companyName);
            setSelectedCompanyId(companyMatch ? companyMatch.id : '');

            // Abre el modal de forma inmediata con los datos cargados
            setIsModalOpen(true);
        }

    }, [folderName, docId, mode, documentDetails]);


    const handleContinue = (e) => {
        e.preventDefault();
        // Solo permite continuar si estamos en modo 'create' y se seleccionaron ambos campos
        if (operationMode === 'create' && selectedDocTypeId && selectedCompanyId) {
            setIsModalOpen(true);
        } else if (operationMode === 'create') {
            alert('Por favor, seleccione el Tipo de Documento y la Empresa Asociada.');
        }
    };
    
    // Función que se ejecuta cuando el modal ha completado la creación
    const handleSaveDocument = (documentData) => {
        console.log("==> Proceso de Creación Completado <==");
        console.log("Tipo de Documento:", documentData.docTypeName);
        console.log("Campos Rellenados:", documentData.fieldsData);
        console.log("Archivo Adjunto:", documentData.attachment);
        alert(`Documento de tipo "${documentData.docTypeName}" registrado con éxito.`);
    };

    const handleDocumentCreatedAndReadyToSend = (documentData) => {
        // 1. Guardar el documento antes de abrir el modal de envío (persistencia)
        handleSaveDocument(documentData); 
        
        // 2. Almacenar los datos del documento y abrir el modal de envío
        setDocumentToSend(documentData);
        setIsSendModalOpen(true);
    };

    const handleSendDocument = (sendData) => {
        console.log("Datos de envío de correo:", sendData);
        setIsSendModalOpen(false);
        setDocumentToSend(null);
    };


    return (
        <LayoutBase>
            <div className="document-type-wrapper-page">
                <div className="cardContainerDocType document-create-card">
                    
                    <h2 className="main-title">{formTitle}</h2>
                    
                    {/* Ocultar el formulario de selección si el modal está abierto en modo ver/editar */}
                    {!(isModalOpen && (operationMode === 'view' || operationMode === 'edit')) && (
                        <form className="document-create-form" onSubmit={handleContinue}>
                            
                            <div className="form-section">
                                
                                {/* Primer campo: Tipo de Documento (Select) */}
                                <div className="form-group-doc-type">
                                    <label htmlFor="docType" className="form-label">Tipo de Documento <span className="required-asterisk">*</span></label>
                                    <select 
                                        id="docType"
                                        className="table-select"
                                        value={selectedDocTypeId}
                                        onChange={(e) => setSelectedDocTypeId(e.target.value)}
                                        disabled={operationMode !== 'create'}
                                        required
                                    >
                                        <option value="" disabled>Seleccione un Tipo de Documento</option>
                                        {MOCK_DOCUMENT_TYPES.map(docType => (
                                            <option key={docType.id} value={docType.id}>
                                                {docType.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Segundo campo: Empresa Asociada (Select) */}
                                <div className="form-group-doc-type">
                                    <label htmlFor="company" className="form-label">Empresa Asociada al Documento <span className="required-asterisk">*</span></label>
                                    <select 
                                        id="company"
                                        className="table-select"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        disabled={operationMode !== 'create'}
                                        required
                                    >
                                        <option value="" disabled>Seleccione una Empresa</option>
                                        {MOCK_COMPANIES.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Botón de Siguiente/Continuar */}
                            {operationMode === 'create' && (
                                <div className="form-footer-buttons">
                                    <button type="submit" className="save-document-type-button continue-button-doc">
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
                
                {/* Renderizado Condicional del Modal */}
                {currentDocType && currentCompany && (
                    <DocumentFieldsModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        company={currentCompany}
                        documentType={currentDocType}
                        onSaveDocument={handleSaveDocument}
                        mode={operationMode}
                        initialFormData={documentDetails?.fieldsData || {}}
                        initialAttachmentName={documentDetails?.attachment}
                        onDocumentCreatedAndReadyToSend={handleDocumentCreatedAndReadyToSend}
                    />
                )}

                {/* Renderizado Condicional del Modal de ENVÍO */}
                {documentToSend && (
                    <SendDocumentModal
                        isOpen={isSendModalOpen}
                        onClose={() => {
                            setIsSendModalOpen(false);
                            setDocumentToSend(null);
                        }}
                        selectedDocuments={[documentToSend]} 
                        selectedDocumentNames={[`${documentToSend.docTypeName} - ${documentToSend.companyName}`]} 
                        onSend={handleSendDocument}
                    />
                )}
            </div>
        </LayoutBase>
    );
};

export default CreateDocumentForm;