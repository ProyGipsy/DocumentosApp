import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css'; 

// --- Configuración de API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- Tipos de Datos ---
const DATA_TYPE_CONFIG = [
    { id: 'text', label: 'Texto Corto', inputType: 'text' },
    { id: 'textarea', label: 'Texto Largo', inputType: 'textarea' },
    { id: 'int', label: 'Número Entero', inputType: 'number', precision: 0 },
    { id: 'float', label: 'Número Decimal', inputType: 'number', precision: 2 },
    { id: 'date', label: 'Fecha', inputType: 'date' },
    { id: 'specificValues', label: 'Valores Específicos', inputType: 'select' },
    // Compatibilidad
    { id: 'text-short', label: 'Texto Corto', inputType: 'text' },
    { id: 'text-long', label: 'Texto Largo', inputType: 'textarea' },
];

const DocumentFieldsModal = ({ 
    isOpen, onClose, company, documentType, onSaveDocument, 
    onDocumentCreatedAndReadyToSend, mode = 'create', 
    initialFormData = {}, initialAttachmentName,
    documentId // <--- Asegúrate de que el PADRE envíe esta prop
}) => {
    
    const [formData, setFormData] = useState({}); 
    const [attachment, setAttachment] = useState(null); 
    const [attachmentName, setAttachmentName] = useState(''); 
    const [sendDocument, setSendDocument] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);

    const isViewing = mode === 'view';
    const isEditing = mode === 'edit';
    const isCreating = mode === 'create';

    // 1. Efecto de Inicialización
    useEffect(() => {
        if (isOpen && documentType) {
            const fieldsDef = documentType.fields || [];

            if (isCreating) {
                const initialData = fieldsDef.reduce((acc, field) => {
                    acc[field.name] = '';
                    return acc;
                }, {});
                setFormData(initialData);
                setAttachment(null);
                setAttachmentName('');
                setSendDocument(false);
            } else {
                setFormData(initialFormData);
                setAttachment(null); 
                setAttachmentName(initialAttachmentName || '');
                setSendDocument(false);
            }
        }
    }, [isOpen, documentType, isCreating, initialFormData, initialAttachmentName]);

    if (!isOpen || !documentType) return null;
    
    const getFieldInputType = (field) => {
        const dataType = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId || dt.id === field.type);
        return dataType ? dataType.inputType : 'text'; 
    };

    const handleFieldChange = (fieldName, value) => {
        if (!isViewing) { 
            setFormData(prevData => ({ ...prevData, [fieldName]: value }));
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentName(file.name);
        }
    };

    // --- LÓGICA DE ENVÍO OPTIMIZADA ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validaciones previas
        if (isCreating && !attachment) {
            alert("El anexo es obligatorio para nuevos documentos.");
            return;
        }
        if (isEditing && !documentId) {
            alert("Error crítico: No se identificó el ID del documento a editar.");
            return;
        }

        if (isCreating || isEditing) {
            setIsSaving(true); 
            
            try {
                // 2. Preparar Datos Comunes
                const fieldsPayload = (documentType.fields || []).map(field => ({
                    fieldId: field.id,
                    value: formData[field.name] || ''
                }));

                const formDataToSend = new FormData();
                
                // Archivo: Se envía si es creación O si es edición y hay uno nuevo
                if (attachment) {
                    formDataToSend.append('file', attachment);
                }

                // 3. Configuración Dinámica (Strategy Pattern simplificado)
                let url = '';
                let method = '';
                let jsonPayload = {};

                if (isCreating) {
                    url = `${apiUrl}/documents/createDocument`;
                    method = 'POST';
                    jsonPayload = {
                        docTypeId: documentType.id,
                        companyId: company.id,
                        fields: fieldsPayload
                    };
                } else {
                    url = `${apiUrl}/documents/editDocument`;
                    method = 'PUT';
                    jsonPayload = {
                        id: documentId, // ID validado arriba
                        fields: fieldsPayload
                    };
                }

                formDataToSend.append('data', JSON.stringify(jsonPayload));

                // 4. Ejecución Única
                console.log(`Enviando ${method} a ${url}...`, jsonPayload);
                const response = await fetch(url, {
                    method: method,
                    body: formDataToSend
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || `Error ${response.status}`);

                // 5. Manejo de Éxito Unificado
                const actionMsg = isCreating ? "creado" : "actualizado";
                alert(`Documento ${actionMsg} exitosamente.`);

                // Construimos el objeto final para actualizar la UI sin recargar
                const finalDocument = {
                    docTypeId: documentType.id,
                    docTypeName: documentType.name,
                    companyId: company.id,
                    companyName: company.name,
                    fieldsData: formData,
                    id: result.document_id || documentId, // ID nuevo o existente
                    // Usamos la nueva URL si el backend la devuelve, sino mantenemos la vieja
                    annexUrl: result.annex_url || result.new_annex_url || initialFormData.annexUrl, 
                    attachment: attachment ? attachment.name : attachmentName,
                    fileObject: attachment,
                    shouldSend: isCreating ? sendDocument : false
                };

                // Cierre y Callbacks
                if (isCreating && sendDocument) {
                    onClose();
                    onDocumentCreatedAndReadyToSend(finalDocument);
                } else {
                    onSaveDocument(finalDocument);
                    onClose();
                }

            } catch (error) {
                console.error("Error al guardar:", error);
                alert(`Error: ${error.message}`);
            } finally {
                setIsSaving(false);
            }
        } 
    };

    // Texto dinámico del botón
    let buttonText = '';
    if (isSaving) buttonText = 'Guardando...';
    else if (isEditing) buttonText = 'Guardar Cambios';
    else if (isCreating) buttonText = sendDocument ? 'Crear y Enviar' : 'Crear Documento';

    const fieldsToRender = documentType.fields || [];

    return (
        <div className="modal-overlay-user" onClick={onClose}>
            <div className="modal-content-user" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-user">
                    <h3>
                        {isViewing ? 'Visualizar' : isEditing ? 'Editar' : 'Nuevo'}: <span style={{color: '#8b56ed'}}>{documentType.name}</span>
                    </h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-body-user" onSubmit={handleSubmit}>
                    
                    {fieldsToRender.map((field, index) => {
                        const inputType = getFieldInputType(field);
                        const precision = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId)?.precision || 0;
                        const stepValue = inputType === 'number' && precision > 0 ? "0.01" : "1";

                        let options = [];
                        if (inputType === 'select' && Array.isArray(field.specificValues)) {
                            options = field.specificValues.map(val => {
                                return typeof val === 'object' && val !== null ? val.value : val;
                            });
                        }

                        if (isViewing) {
                            return (
                                <div className="form-group-user" key={index}>
                                    <label>{field.name}:</label>
                                    <p className="static-field-value">{formData[field.name] || '-'}</p>
                                </div>
                            );
                        }

                        return (
                            <div className="form-group-user" key={index}>
                                <label><span className="required-asterisk">*</span> {field.name}:</label>
                                
                                {inputType === 'select' ? (
                                    <select 
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        required
                                        className="form-input-doc-create"
                                    >
                                        <option value="" disabled>Seleccione una opción</option>
                                        {options.map((optValue, idx) => (
                                            <option key={idx} value={optValue}>{optValue}</option>
                                        ))}
                                    </select>
                                ) : inputType === 'textarea' ? (
                                    <textarea
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        rows="3"
                                        required
                                        placeholder={`Ingrese ${field.name}...`}
                                        className="form-input-doc-create"
                                    />
                                ) : (
                                    <input 
                                        type={inputType}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        step={inputType === 'number' ? stepValue : undefined}
                                        required
                                        placeholder={`Ingrese ${field.name}...`}
                                        className="form-input-doc-create"
                                    />
                                )}
                            </div>
                        );
                    })}
                    
                    <div className="form-group-user file-upload-group">
                        <label><span className="required-asterisk">*</span> Anexo:</label>
                        {(isCreating || isEditing) && (
                            <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
                                Solo se aceptan archivos PDF
                            </small>
                        )}
                        {!isViewing && (
                            <>
                                <input 
                                    type="file"
                                    accept=".pdf"
                                    className="form-input-doc-create file-input"
                                    onChange={handleFileChange}
                                    required={isCreating} 
                                />
                                {/* HOLA. Aquí se quiere agregar el enlace del archivo anexo del documento */}
                                {isEditing && attachmentName && !attachment && initialFormData.annexUrl (
                                    <small style={{display:'block', marginTop:'5px', color:'#666'}}>
                                        Actual:
                                        <strong>
                                            <a 
                                                href={initialFormData.annexUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="file-link-display"
                                            >
                                                {attachmentName}
                                            </a>
                                        </strong>
                                    </small>
                                )}
                            </>
                        )}
                        {/* HOLA. Aquí se quiere agregar el enlace del archivo anexo del documento.
                            Comento el fragmento original. Para agregar el enlace en visualización debería ser algo tipo lo que está abajo. */}
                        {/* {isViewing && (
                            <p className="static-field-value file-name-display">{attachmentName || 'Sin archivo'}</p>
                        )} */}
                        {isViewing && (
                            <div className="form-group-user file-upload-group"> 
                                <label>Anexo:</label>
                                {initialFormData.annexUrl ? (
                                    <p className="static-field-value file-name-display">
                                        <strong>
                                            <a 
                                                href={initialFormData.annexUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="file-link-display"
                                            >
                                                {attachmentName || 'Ver Anexo'}
                                            </a>
                                        </strong>
                                    </p>
                                ) : (
                                    <p className="static-field-value file-name-display">Sin archivo</p>
                                )}
                            </div>
                        )}
                    </div>

                    {isCreating && (
                        <div className="form-group-user send-checkbox-group">
                            <label htmlFor="send-doc-checkbox" className="send-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="send-doc-checkbox"
                                    checked={sendDocument} 
                                    onChange={(e) => setSendDocument(e.target.checked)}
                                    style={{marginRight: '10px'}}
                                />
                                <span className="custom-checkmark"></span>
                                ¿Desea enviar el documento luego de crearlo?
                            </label>
                        </div>
                    )}

                    {!isViewing && (
                        <div className="modal-footer-user">
                            <button 
                                type="submit" 
                                className="modal-button-user save-button-user"
                                disabled={isSaving}
                                style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'wait' : 'pointer' }}
                            >
                                {buttonText} 
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DocumentFieldsModal;