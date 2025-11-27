import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LayoutBase from '../base/LayoutBase'; 
import '../../styles/general/documentTypeForm.css'; 
import DocumentFieldsModal from './DocumentFieldsModal';
import SendDocumentModal from './SendDocumentModal';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const CreateDocumentForm = () => {
    const location = useLocation(); 
    const { folderName, docId, mode, documentDetails } = location.state || {};

    // Cambié el nombre para evitar confusión con constantes. Ahora son variables de estado.
    const [documentTypes, setDocumentTypes] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [operationMode, setOperationMode] = useState(mode || 'create');

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [documentToSend, setDocumentToSend] = useState(null);

    const [fullDocTypeDetails, setFullDocTypeDetails] = useState(null);

    const formTitle = operationMode === 'view' 
        ? 'Visualización de Documento' 
        : operationMode === 'edit' 
        ? 'Edición de Documento' 
        : 'Creación de Documento';

    // 1. CARGA DE DATOS
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Usamos Promise.all para cargar ambos en paralelo (más rápido)
                const [docsRes, companiesRes] = await Promise.all([
                    fetch(`${apiUrl}/documents/getDocType`),
                    fetch(`${apiUrl}/documents/getDocCompanies`)
                ]);

                if (!docsRes.ok || !companiesRes.ok) throw new Error("Error cargando datos");

                const docsData = await docsRes.json();
                const companiesData = await companiesRes.json();

                setDocumentTypes(docsData);
                setCompanies(companiesData);
            } catch (err) {
                console.error('Error cargando datos:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. CORRECCIÓN useMemo: Conversión de tipos y dependencias
    const currentDocType = useMemo(() => {
        if (!selectedDocTypeId) return null;
        // Convertimos ambos a String para asegurar que coincidan sin importar si la API manda Int
        return documentTypes.find(dt => String(dt.id) === String(selectedDocTypeId));
    }, [selectedDocTypeId, documentTypes]); // Agregamos documentTypes como dependencia

    const currentCompany = useMemo(() => {
        if (!selectedCompanyId) return null;
        return companies.find(c => String(c.id) === String(selectedCompanyId));
    }, [selectedCompanyId, companies]); // Agregamos companies como dependencia


    // 3. CORRECCIÓN DE PRE-SELECCIÓN (Lógica movida dentro del efecto de datos)
    // El problema original era que intentabas buscar el ID antes de que el fetch terminara.
    useEffect(() => {
        // Solo ejecutamos si ya hay datos cargados
        if (documentTypes.length > 0 && companies.length > 0) {
            
            if (mode === 'create' && folderName) {
                // Buscamos el ID basado en el nombre dentro de los datos cargados
                const match = documentTypes.find(dt => 
                    dt.name.toLowerCase().includes(folderName.toLowerCase()) || 
                    folderName.toLowerCase().includes(dt.name.toLowerCase())
                );
                if (match) {
                    setSelectedDocTypeId(match.id);
                }
                setOperationMode('create');

            } else if (docId && (mode === 'view' || mode === 'edit') && documentDetails) {
                setOperationMode(mode);
                setSelectedDocTypeId(documentDetails.docTypeId);
                
                // Búsqueda robusta de empresa
                const companyMatch = companies.find(c => 
                    String(c.id) === String(documentDetails.companyId) || 
                    c.name === documentDetails.companyName
                );
                if (companyMatch) setSelectedCompanyId(companyMatch.id);

                setIsModalOpen(true);
            }
        }
    }, [folderName, docId, mode, documentDetails, documentTypes, companies]); // Dependemos de que lleguen los datos 

    const handleContinue = async (e) => {
        e.preventDefault();
        
        if (operationMode === 'create' && currentDocType && currentCompany) {
            setIsLoading(true);
            
            try {
                const params = new URLSearchParams({ id: selectedDocTypeId });
                //console.log("1. Solicitando URL:", `${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                
                const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                //console.log("2. Status HTTP:", response.status); // Debería ser 200

                // Leemos el texto crudo primero para ver si es JSON válido
                const textData = await response.text(); 
                //console.log("3. Respuesta Cruda del Servidor:", textData);

                if (!textData) throw new Error("La respuesta está vacía (Body vacío)");

                // Intentamos convertirlo a JSON
                const data = JSON.parse(textData);
                //console.log("4. JSON Parseado:", data);

                // Verificamos si tiene la estructura correcta
                if (!data.fields) {
                    console.error("⚠️ ALERTA: El objeto recibido no tiene la propiedad 'fields'");
                }

                setFullDocTypeDetails(data);
                console.log(data);
                setIsModalOpen(true);

            } catch (error) {
                console.error("❌ ERROR CAPTURADO:", error);
                alert(`Error técnico: ${error.message}`);
            } finally {
                setIsLoading(false);
            }

        } else if (operationMode === 'create') {
            alert('Por favor, seleccione el Tipo de Documento y la Empresa Asociada.');
        }
    };

    // ... (El resto de funciones handleSaveDocument, etc. permanecen igual) ...
    const handleSaveDocument = (documentData) => { /* ... */ };
    const handleDocumentCreatedAndReadyToSend = (documentData) => { 
        handleSaveDocument(documentData); 
        setDocumentToSend(documentData);
        setIsSendModalOpen(true);
    };
    const handleSendDocument = (sendData) => { /* ... */ setIsSendModalOpen(false); };

    return (
        <LayoutBase>
            <div className="document-type-wrapper-page">
                <div className="cardContainerDocType document-create-card">
                    
                    <h2 className="main-title">{formTitle}</h2>
                    
                    {/* Loader simple para evitar que el usuario interactúe antes de cargar datos */}
                    {isLoading && <p>Cargando datos...</p>}

                    {!(isModalOpen && (operationMode === 'view' || operationMode === 'edit')) && !isLoading && (
                        <form className="document-create-form" onSubmit={handleContinue}>
                            
                            <div className="form-section">
                                {/* Select Tipo Documento */}
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
                                        {documentTypes.map(docType => (
                                            <option key={docType.id} value={docType.id}>
                                                {docType.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Select Empresa */}
                                <div className="form-group-doc-type">
                                    <label htmlFor="company" className="form-label">Empresa Asociada <span className="required-asterisk">*</span></label>
                                    <select 
                                        id="company"
                                        className="table-select"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        disabled={operationMode !== 'create'}
                                        required
                                    >
                                        <option value="" disabled>Seleccione una Empresa</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                
                {/* CORRECCIÓN FINAL: 
                    Aseguramos que currentDocType y currentCompany existan. 
                    Gracias al String() en useMemo, ahora deberían coincidir.
                */}
                {fullDocTypeDetails && currentCompany && (
                    <DocumentFieldsModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false)
                            setFullDocTypeDetails(null);
                        }}
                        company={currentCompany}
                        documentType={fullDocTypeDetails}
                        onSaveDocument={handleSaveDocument}
                        mode={operationMode}
                        initialFormData={documentDetails?.fieldsData || {}}
                        initialAttachmentName={documentDetails?.attachment}
                        onDocumentCreatedAndReadyToSend={handleDocumentCreatedAndReadyToSend}
                    />
                )}

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