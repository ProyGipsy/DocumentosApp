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

    // 2. MEMOS
    const currentDocType = useMemo(() => {
        if (!selectedDocTypeId) return null;
        return documentTypes.find(dt => String(dt.id) === String(selectedDocTypeId));
    }, [selectedDocTypeId, documentTypes]); 

    const currentCompany = useMemo(() => {
        if (!selectedCompanyId) return null;
        return companies.find(c => String(c.id) === String(selectedCompanyId));
    }, [selectedCompanyId, companies]); 


    // 3. INICIALIZACIÓN
    useEffect(() => {
        const initializeForm = async () => {
            if (documentTypes.length > 0 && companies.length > 0) {
                
                if (mode === 'create' && folderName) {
                    const match = documentTypes.find(dt => 
                        dt.name.toLowerCase().includes(folderName.toLowerCase()) || 
                        folderName.toLowerCase().includes(dt.name.toLowerCase())
                    );
                    if (match) setSelectedDocTypeId(match.id);
                    setOperationMode('create');
                } 
                
                else if (docId && (mode === 'view' || mode === 'edit') && documentDetails) {
                    setOperationMode(mode);
                    setSelectedDocTypeId(documentDetails.docTypeId);
                    
                    const companyMatch = companies.find(c => 
                        String(c.id) === String(documentDetails.companyId) || 
                        c.name === documentDetails.companyName
                    );
                    if (companyMatch) setSelectedCompanyId(companyMatch.id);

                    try {
                        setIsLoading(true);
                        const params = new URLSearchParams({ id: documentDetails.docTypeId });
                        const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                        
                        if (response.ok) {
                            const fullData = await response.json();
                            setFullDocTypeDetails(fullData); 
                            setIsModalOpen(true); 
                        } else {
                            console.error("Error cargando configuración de campos para editar");
                        }
                    } catch (err) {
                        console.error("Error en fetch de detalles:", err);
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };

        initializeForm();
    }, [folderName, docId, mode, documentDetails, documentTypes, companies]); 
    
    // 4. PREPARAR MODAL DE CAMPOS
    const handleContinue = async (e) => {
        e.preventDefault();
        
        if (operationMode === 'create' && currentDocType && currentCompany) {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ id: selectedDocTypeId });
                const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                const textData = await response.text(); 

                if (!textData) throw new Error("La respuesta está vacía");
                const data = JSON.parse(textData);
                console.log(data.fields[0].id);

                setFullDocTypeDetails(data);
                setIsModalOpen(true);

            } catch (error) {
                console.error("Error:", error);
                alert(`Error técnico: ${error.message}`);
            } finally {
                setIsLoading(false);
            }

        } else if (operationMode === 'create') {
            alert('Por favor, seleccione el Tipo de Documento y la Entidad Asociada.');
        }
    };

    const handleSaveDocument = (documentData) => { 
        console.log("Documento guardado localmente (UI):", documentData);
    };

    const handleDocumentCreatedAndReadyToSend = (documentData) => { 
        handleSaveDocument(documentData); 
        // Guardamos el documento recién creado (con su ID) para enviarlo
        setDocumentToSend(documentData);
        setIsSendModalOpen(true);
    };

    // --- 5. LÓGICA DE ENVÍO DE CORREO (IMPLEMENTADA) ---
    const handleSendDocument = async (selectedDocsIgnored, emailData) => { 
        // Nota: El primer argumento viene del modal como lista de documentos seleccionados.
        // En este flujo de "Crear y Enviar", enviamos específicamente 'documentToSend'.
        
        if (!documentToSend || !documentToSend.id) {
            alert("Error: No se ha identificado el documento a enviar.");
            return;
        }

        console.log("Enviando correo...", emailData);
        setIsLoading(true);

        try {
            const payload = {
                documentIds: [documentToSend.id], // Enviamos el ID del documento recién creado
                emailData: emailData
            };

            const response = await fetch(`${apiUrl}/documents/sendDocuments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error al enviar el correo');

            alert('Documento enviado exitosamente por correo.');
            
            setIsSendModalOpen(false); 
            setDocumentToSend(null);

        } catch (error) {
            console.error("Error enviando correo:", error);
            alert(`Hubo un problema al enviar el correo: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LayoutBase>
            <div className="document-type-wrapper-page">
                <div className="cardContainerDocType document-create-card">
                    
                    <h2 className="main-title">{formTitle}</h2>
                    
                    {isLoading && <p>Cargando datos...</p>}

                    {!(isModalOpen && (operationMode === 'view' || operationMode === 'edit')) && !isLoading && (
                        <form className="document-create-form" onSubmit={handleContinue}>
                            
                            <div className="form-section">
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

                                <div className="form-group-doc-type">
                                    <label htmlFor="company" className="form-label">Entidad Asociada <span className="required-asterisk">*</span></label>
                                    <select 
                                        id="company"
                                        className="table-select"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        disabled={operationMode !== 'create'}
                                        required
                                    >
                                        <option value="" disabled>Seleccione una Entidad</option>
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
                
                {/* MODAL DE CAMPOS */}
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
                        documentId={documentDetails?.docId}
                        initialFormData={documentDetails?.fieldsData || {}}
                        initialAttachmentName={documentDetails?.attachment}
                        onDocumentCreatedAndReadyToSend={handleDocumentCreatedAndReadyToSend}
                        currentAnnexUrl={documentDetails?.annexUrl}
                    />
                )}

                {/* MODAL DE ENVÍO */}
                {documentToSend && (
                    <SendDocumentModal
                        isOpen={isSendModalOpen}
                        onClose={() => {
                            setIsSendModalOpen(false);
                            setDocumentToSend(null);
                        }}
                        // Pasamos el documento en un array porque el modal espera una lista
                        selectedDocuments={[documentToSend.id]} 
                        selectedDocumentNames={[`${documentToSend.docTypeName} - ${documentToSend.companyName}`]} 
                        // Conectamos la función real de envío
                        onSend={handleSendDocument}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </LayoutBase>
    );
};

export default CreateDocumentForm;