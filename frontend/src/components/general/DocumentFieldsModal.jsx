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
    { id: 'char', label: 'Caracter', inputType: 'text' }, // Agregado explícitamente
    { id: 'specificValues', label: 'Valores Específicos', inputType: 'select' },
    // Compatibilidad
    { id: 'text-short', label: 'Texto Corto', inputType: 'text' },
    { id: 'text-long', label: 'Texto Largo', inputType: 'textarea' },
];

const DocumentFieldsModal = ({ 
    isOpen, onClose, company, documentType, onSaveDocument, 
    onDocumentCreatedAndReadyToSend, mode = 'create', 
    initialFormData = {}, initialAttachmentName,
    documentId, currentAnnexUrl
}) => {
    
    const [formData, setFormData] = useState({}); 
    const [attachment, setAttachment] = useState(null); 
    const [attachmentName, setAttachmentName] = useState(''); 
    const [sendDocument, setSendDocument] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);

    const isViewing = mode === 'view';
    const isEditing = mode === 'edit';
    const isCreating = mode === 'create';

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

    // --- LÓGICA DE VALIDACIÓN DE ENTRADA ---
    const handleFieldChange = (field, value) => {
        if (isViewing) return;

        const inputType = getFieldInputType(field);
        
        // 1. Validación de Longitud (Length)
        // Si el campo tiene longitud definida (mayor a 0)
        if (field.length && field.length > 0) {
            if (value.length > field.length) {
                return; // No actualizamos si excede el límite
            }
        }
        
        // 2. Validación específica para 'char' (Solo 1 caracter si no tiene longitud definida)
        if (field.typeId === 'char') {
            const maxLen = (field.length && field.length > 0) ? field.length : 1;
            if (value.length > maxLen) return;
        }

        // 3. Validación para 'int' (Solo números enteros)
        // Aunque el input type="number" ayuda, esto evita pegar texto no numérico o decimales si el navegador lo permite
        if (inputType === 'number') {
             // Obtenemos la configuración del tipo para saber la precisión
             const typeConfig = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId || dt.id === field.type);
             const isInteger = typeConfig && typeConfig.precision === 0;

             if (isInteger) {
                 // Si contiene algo que no sea dígito (y no está vacío), lo bloqueamos
                 if (value !== '' && !/^-?\d*$/.test(value)) {
                     return;
                 }
             }
             // Nota: Para 'float' dejamos pasar el punto decimal
        }

        setFormData(prevData => ({
            ...prevData,
            [field.name]: value
        }));
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
            alert("El anexo es obligatorio para nuevos documentos.");
            return;
        }
        if (isEditing && !documentId) {
            alert("Error crítico: No se identificó el ID del documento para editar.");
            return;
        }

        setIsSaving(true); 
        
        try {
            const fieldsPayload = (documentType.fields || []).map(field => ({
                fieldId: field.id,
                value: formData[field.name] || ''
            }));

            const formDataToSend = new FormData();
            if (attachment) {
                formDataToSend.append('file', attachment);
            }

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
                    id: documentId, 
                    fields: fieldsPayload
                };
            }

            formDataToSend.append('data', JSON.stringify(jsonPayload));

            console.log(`Enviando ${method}...`, jsonPayload);
            const response = await fetch(url, {
                method: method,
                body: formDataToSend
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Error ${response.status}`);

            const actionMsg = isCreating ? "creado" : "actualizado";
            alert(`Documento ${actionMsg} exitosamente.`);

            const finalDocument = {
                docTypeId: documentType.id,
                docTypeName: documentType.name,
                companyId: company.id,
                companyName: company.name,
                fieldsData: formData,
                id: result.document_id || documentId,
                annexUrl: result.annex_url || result.new_annex_url || initialFormData.annexUrl, 
                attachment: attachment ? attachment.name : attachmentName,
                fileObject: attachment,
                shouldSend: isCreating ? sendDocument : false
            };

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
    };

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
                        {isViewing ? 'Visualizar' : isEditing ? 'Editar' : 'Nuevo'}: <span style={{color: '#8b56ed'}}>{documentType.name}-{company.name}</span>
                    </h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-body-user" onSubmit={handleSubmit}>
                    
                    {fieldsToRender.map((field, index) => {
                        const inputType = getFieldInputType(field);
                        const precision = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId)?.precision || 0;
                        // Configurar step para decimales o enteros
                        const stepValue = inputType === 'number' && precision > 0 ? `0.${'0'.repeat(precision - 1)}1` : "1";
                        
                        // Configurar maxLength dinámico
                        let maxLen = undefined;
                        if (field.length && field.length > 0) {
                            maxLen = field.length;
                        } else if (field.typeId === 'char') {
                            maxLen = 1;
                        }

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
                                        // Nota: Pasamos el objeto 'field' completo
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
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
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        rows="3"
                                        required
                                        maxLength={maxLen} // Atributo nativo HTML
                                        placeholder={`Ingrese ${field.name}...`}
                                        className="form-input-doc-create"
                                    />
                                
                                ) : (
                                    <input 
                                        type={inputType}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        step={inputType === 'number' ? stepValue : undefined}
                                        maxLength={maxLen} // Atributo nativo HTML (Nota: en type="number" algunos navegadores ignoran esto, por eso la validación JS en handleFieldChange es vital)
                                        required
                                        placeholder={`Ingrese ${field.name}...`}
                                        className="form-input-doc-create"
                                    />
                                )}
                            </div>
                        );
                    })}
                    
                    {/* ... resto del formulario (Archivo y Botones) igual que antes ... */}
                    <div className="form-group-user file-upload-group">
                        {(isCreating || isEditing) && (
                            <label><span className="required-asterisk">*</span> Anexo:</label>
                        )}
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
                                {isEditing && attachmentName && !attachment && currentAnnexUrl && (
                                    <small style={{display:'block', marginTop:'5px', color:'#666'}}>
                                        Actual:
                                        <strong>
                                            <a 
                                                href={currentAnnexUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="file-link-display"
                                            >
                                                {documentType.name}-{company.name} Anexo.pdf
                                            </a>
                                        </strong>
                                    </small>
                                )}
                            </>
                        )}
                        {isViewing && (
                            <div className="form-group-user"> 
                                <label>Anexo:</label>
                                {currentAnnexUrl ? (
                                    <p className="static-field-value file-name-display">
                                        <strong>
                                            <a 
                                                href={currentAnnexUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="file-link-display"
                                            >
                                                Ver Anexo {documentType.name}-{company.name}.pdf
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