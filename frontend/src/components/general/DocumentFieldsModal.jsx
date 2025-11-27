import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css'; 

// --- Configuración de API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// --- Tipos de Datos (Sincronizados con tu Base de Datos SQL) ---
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
    initialFormData = {}, initialAttachmentName 
}) => {
    
    const [formData, setFormData] = useState({}); 
    const [attachment, setAttachment] = useState(null); 
    const [attachmentName, setAttachmentName] = useState(''); 
    const [sendDocument, setSendDocument] = useState(false);
    
    // Nuevo estado para el loader de guardado
    const [isSaving, setIsSaving] = useState(false);

    const isViewing = mode === 'view';
    const isEditing = mode === 'edit';
    const isCreating = mode === 'create';

    // 1. Efecto de Inicialización
    useEffect(() => {
        if (isOpen && documentType) {
            if (isCreating) {
                const initialData = documentType.fields.reduce((acc, field) => {
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
            setFormData(prevData => ({
                ...prevData,
                [fieldName]: value
            }));
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isCreating && !attachment) {
            alert("El anexo es obligatorio.");
            return;
        }

        if (isCreating || isEditing) {
            setIsSaving(true); // Activar loader
            
            try {
                // 1. Preparar Payload de Campos (Mapeo a IDs)
                const fieldsPayload = documentType.fields.map(field => ({
                    fieldId: field.id,
                    value: formData[field.name] || ''
                }));

                const documentData = {
                    docTypeId: documentType.id,
                    docTypeName: documentType.name,
                    companyId: company.id,
                    companyName: company.name,
                    fields: fieldsPayload,
                    // Estos campos extra sirven para la UI local
                    fieldsData: formData, 
                    attachment: attachment ? attachment.name : attachmentName
                };

                if (isCreating) {
                    // --- LÓGICA DE CREACIÓN (FETCH) ---
                    const formDataToSend = new FormData();
                    
                    // A. Adjuntar archivo
                    formDataToSend.append('file', attachment);
                    
                    // B. Adjuntar datos JSON como string
                    // OJO: Enviamos 'fields' (con IDs) que es lo que espera el backend optimizado
                    const jsonPayload = {
                        docTypeId: documentData.docTypeId,
                        companyId: documentData.companyId,
                        fields: documentData.fields
                    };
                    formDataToSend.append('data', JSON.stringify(jsonPayload));

                    // C. Petición al Backend
                    console.log("Enviando datos...", jsonPayload);
                    const response = await fetch(`${apiUrl}/documents/createDocument`, {
                        method: 'POST',
                        body: formDataToSend // Fetch pone el Content-Type multipart/form-data automáticamente
                    });

                    //const result = await response.json();
                    const textResponse = await response.text();
                    console.log("Respuesta del servidor:", textResponse);

                    try {
                        const result = JSON.parse(textResponse);
                        if (!response.ok) throw new Error(result.error);
                        
                        console.log("Documento creado ID:", result.document_id);
                        alert(`Documento creado exitosamente. ID: ${result.document_id}`);

                        // Agregamos el ID real al objeto local para pasarlo al padre
                        const createdDocument = {
                            ...documentData,
                            id: result.document_id,
                            annexUrl: result.annex_url,
                            fileObject: attachment,
                            shouldSend: sendDocument
                        };

                        // D. Manejo Post-Creación
                        if (sendDocument) {
                            onClose();
                            onDocumentCreatedAndReadyToSend(createdDocument);
                        } else {
                            onSaveDocument(createdDocument);
                            onClose();
                        }
                        
                    } catch (e) {
                        console.error("No es un JSON válido. Error:", e);
                        alert("Error del servidor (Ver consola para detalles)");
                    }

                    

                } else if (isEditing) {
                    // --- LÓGICA DE EDICIÓN (Pendiente de implementar en backend) ---
                    // Por ahora mantenemos la lógica local que tenías
                    // (Aquí iría un fetch similar pero con PUT y endpoint de edición)
                    
                    const documentToUpdate = {
                        ...documentData,
                        fileObject: attachment,
                        shouldSend: false
                    };
                    
                    alert(`Documento "${documentType.name}" editado con éxito (Local).`);
                    onSaveDocument(documentToUpdate);
                    onClose();
                }

            } catch (error) {
                console.error("Error al guardar:", error);
                alert(`Error al guardar el documento: ${error.message}`);
            } finally {
                setIsSaving(false); // Desactivar loader
            }
        } 
    };

    // Texto dinámico del botón
    let buttonText = '';
    if (isSaving) {
        buttonText = 'Guardando...';
    } else if (isEditing) {
        buttonText = 'Guardar Cambios';
    } else if (isCreating) {
        buttonText = sendDocument ? 'Crear y Enviar' : 'Crear Documento';
    }

    return (
        <div className="modal-overlay-user" onClick={onClose}>
            <div
                className="modal-content-user"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header-user">
                    <h3>
                        {isViewing ? 'Visualizar' : isEditing ? 'Editar' : 'Nuevo'}: <span style={{color: '#8b56ed'}}>{documentType.name}</span>
                    </h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-body-user" onSubmit={handleSubmit}>
                    
                    {/* Renderizado de Campos Dinámicos */}
                    {documentType.fields.map((field, index) => {
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
                    
                    {/* Campo de Archivo */}
                    <div className="form-group-user file-upload-group">
                        <label>
                            <span className="required-asterisk">*</span> Anexo (.pdf):
                        </label>
                        
                        {!isViewing && (
                            <>
                                <input 
                                    type="file"
                                    accept=".pdf"
                                    className="form-input-doc-create file-input"
                                    onChange={handleFileChange}
                                    required={isCreating} 
                                />
                                {isEditing && attachmentName && !attachment && (
                                    <small style={{display:'block', marginTop:'5px', color:'#666'}}>
                                        Actual: <strong>{attachmentName}</strong> (Suba uno nuevo para cambiarlo)
                                    </small>
                                )}
                            </>
                        )}

                        {isViewing && (
                            <p className="static-field-value file-name-display">{attachmentName || 'Sin archivo'}</p>
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
                                ¿Desea enviar el documento luego de crearlo?
                            </label>
                        </div>
                    )}

                    {!isViewing && (
                        <div className="modal-footer-user">
                            <button 
                                type="submit" 
                                className="modal-button-user save-button-user"
                                disabled={isSaving} // Deshabilitar mientras guarda
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