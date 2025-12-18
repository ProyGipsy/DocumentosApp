import React, { useState, useEffect, useRef } from 'react';
import '../../styles/general/sendDocModal.css'; 

// --- Configuración de API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const DATA_TYPE_CONFIG = [
    { id: 'text', label: 'Texto Corto', inputType: 'text' },
    { id: 'textarea', label: 'Texto Largo', inputType: 'textarea' },
    { id: 'int', label: 'Número Entero', inputType: 'number', precision: 0 },
    { id: 'float', label: 'Número Decimal', inputType: 'number', precision: 2 },
    { id: 'money', label: 'Moneda', inputType: 'number', precision: 2 },
    { id: 'date', label: 'Fecha', inputType: 'date' },
    { id: 'char', label: 'Caracter', inputType: 'text' },
    { id: 'bool', label: 'Sí/No', inputType: 'checkbox' }, 
    { id: 'specificValues', label: 'Valores Específicos', inputType: 'select' },
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
    
    // --- ESTADOS PARA EMPRESAS ---
    const [availableCompanies, setAvailableCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
    
    const companyDropdownRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    const isViewing = mode === 'view';
    const isEditing = mode === 'edit';
    const isCreating = mode === 'create';

    // 1. Fetch de Entidades Disponibles
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${apiUrl}/documents/getDocCompanies`);
                if (response.ok) {
                    const data = await response.json();
                    setAvailableCompanies(data);
                }
            } catch (error) {
                console.error("Error cargando entidades:", error);
            }
        };
        if (isOpen) {
            fetchCompanies();
        }
    }, [isOpen]);

    // 2. Click Outside para cerrar dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
                setIsCompanyDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 3. Inicialización de Formulario y Entidades
    useEffect(() => {
        if (isOpen && documentType) {
            const fieldsDef = documentType.fields || [];

            if (isCreating) {
                const initialData = fieldsDef.reduce((acc, field) => {
                    acc[field.name] = field.type === 'bool' || field.typeId === 'bool' ? false : '';
                    return acc;
                }, {});
                setFormData(initialData);
                setAttachment(null);
                setAttachmentName('');
                setSendDocument(false);
                setSelectedCompanyIds([]); 
            } else {
                const processedData = { ...initialFormData };
                fieldsDef.forEach(field => {
                    if (field.type === 'bool' || field.typeId === 'bool') {
                        const val = initialFormData[field.name];
                        processedData[field.name] = (val === 1 || val === '1' || val === true || val === 'true');
                    }
                });

                setFormData(processedData);
                setAttachment(null); 
                setAttachmentName(initialAttachmentName || '');
                setSendDocument(false);

                if (company && company.id) {
                    const ids = Array.isArray(company.id) ? company.id : [company.id];
                    setSelectedCompanyIds(ids);
                }
            }
        }
    }, [isOpen, documentType, isCreating, initialFormData, initialAttachmentName, company]);

    if (!isOpen || !documentType) return null;
    
    const getFieldInputType = (field) => {
        const dataType = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId || dt.id === field.type);
        return dataType ? dataType.inputType : 'text'; 
    };

    // --- MANEJADORES ---
    const handleFieldChange = (field, value) => {
        if (isViewing) return;
        const inputType = getFieldInputType(field);
        
        if (field.length && field.length > 0 && typeof value === 'string') {
            if (value.length > field.length) return;
        }
        
        if (field.typeId === 'char') {
            const maxLen = (field.length && field.length > 0) ? field.length : 1;
            if (value.length > maxLen) return;
        }

        if (inputType === 'number') {
             const typeConfig = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId || dt.id === field.type);
             const isInteger = typeConfig && typeConfig.precision === 0;
             if (isInteger) {
                 if (value !== '' && !/^-?\d*$/.test(value)) return;
             }
        }

        setFormData(prevData => ({ ...prevData, [field.name]: value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentName(file.name);
        }
    };

    const handleToggleCompany = (companyObj) => {
        setSelectedCompanyIds(prev => {
            const exists = prev.includes(companyObj.id);
            if (exists) {
                return prev.filter(id => id !== companyObj.id);
            } else {
                return [...prev, companyObj.id];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isEditing && !documentId) {
            alert("Error crítico: No se identificó el ID del documento para editar.");
            return;
        }

        if (selectedCompanyIds.length === 0) {
            alert("Debe seleccionar al menos una entidad asociada.");
            return;
        }

        setIsSaving(true); 
        
        try {
            const docNameField = (documentType.fields || []).find(
                f => f.name.trim().toLowerCase() === 'nombre del documento'
            );
            const documentNameValue = docNameField ? (formData[docNameField.name] || '') : 'Documento Sin Nombre';

            const fieldsPayload = (documentType.fields || []).map(field => ({
                fieldId: field.id,
                value: formData[field.name] 
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
                    companyId: selectedCompanyIds, 
                    documentName: documentNameValue, 
                    fields: fieldsPayload 
                };
            } else {
                url = `${apiUrl}/documents/editDocument`;
                method = 'PUT';
                jsonPayload = {
                    id: documentId, 
                    companyId: selectedCompanyIds, 
                    documentName: documentNameValue, 
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

            const selectedCompanyNames = availableCompanies
                .filter(c => selectedCompanyIds.includes(c.id))
                .map(c => c.name)
                .join(', ');

            const finalDocument = {
                docTypeId: documentType.id,
                docTypeName: documentType.name,
                companyId: selectedCompanyIds, 
                companyName: selectedCompanyNames, 
                fieldsData: formData,
                id: result.document_id || documentId,
                docName: result.document_name || documentNameValue,
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

    const rawFields = documentType.fields || [];
    const nameField = rawFields.find(f => f.name.trim().toLowerCase() === 'nombre del documento');
    const otherFields = rawFields.filter(f => f.name.trim().toLowerCase() !== 'nombre del documento');
    const fieldsToRender = nameField ? [nameField, ...otherFields] : rawFields;

    return (
        <div className="modal-overlay-user" onClick={onClose}>
            <div className="modal-content-user" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-user">
                    <h3>
                        {isViewing ? 'Visualizar' : isEditing ? 'Editar' : 'Nuevo'}: <span style={{color: '#8b56ed'}}>{documentType.name}</span>
                    </h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>
                
                {/* --- SECCIÓN DE SELECCIÓN DE EMPRESAS --- */}
                <div className="modal-header-user" style={{ paddingTop: 0, paddingBottom: '15px' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>
                        Entidades Asociadas <span className="required-asterisk">*</span>
                    </h5>
                    
                    {isViewing ? (
                        // --- MODO VISTA: Muestra solo el contador ---
                        <div 
                            className="static-field-value" 
                            style={{ fontWeight: 'bold', color: '#333', cursor: 'help' }}
                            // Tooltip con los nombres reales al pasar el mouse
                            title={availableCompanies
                                .filter(c => selectedCompanyIds.includes(c.id))
                                .map(c => c.name)
                                .join(', ')
                            }
                        >
                            {selectedCompanyIds.length > 0 
                                ? `${selectedCompanyIds.length} Entidad${selectedCompanyIds.length !== 1 ? 'es' : ''} Asociada${selectedCompanyIds.length !== 1 ? 's' : ''}`
                                : "Sin entidades asignadas"
                            }
                        </div>
                    ) : (
                        // MODO EDICIÓN/CREACIÓN: Dropdown con checkboxes
                        <div className="permisos-container-modal" ref={companyDropdownRef} style={{ position: 'relative' }}>
                            <div
                                className="permiso-dropdown-toggle"
                                onClick={(e) => { e.stopPropagation(); setIsCompanyDropdownOpen(prev => !prev); }}
                                style={{ 
                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                    border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' 
                                }}
                            >
                                <div className="selected-summary" style={{ flex: 1, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedCompanyIds.length > 0 
                                        ? `${selectedCompanyIds.length} Entidades seleccionadas`
                                        : 'Seleccione las entidades ...'}
                                </div>
                                <div className="caret">▾</div>
                            </div>

                            {isCompanyDropdownOpen && (
                                <div className="dropdown-panel" style={{ 
                                    position: 'absolute', width: '100%', maxHeight: 200, overflowY: 'auto', 
                                    border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4,
                                    marginTop: '2px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    {availableCompanies.map(comp => {
                                        const isSelected = selectedCompanyIds.includes(comp.id);
                                        return (
                                            <label key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleCompany(comp)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '14px' }}>{comp.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form className="modal-body-user" onSubmit={handleSubmit}>
                    
                    {fieldsToRender.map((field, index) => {
                        const inputType = getFieldInputType(field);
                        const precision = DATA_TYPE_CONFIG.find(dt => dt.id === field.typeId)?.precision || 0;
                        const stepValue = inputType === 'number' && precision > 0 ? `0.${'0'.repeat(precision - 1)}1` : "1";
                        
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
                            let displayValue = formData[field.name];
                            if (inputType === 'checkbox') {
                                displayValue = formData[field.name] ? 'Sí' : 'No';
                            } else if (!displayValue) {
                                displayValue = '-';
                            }

                            return (
                                <div className="form-group-user" key={index}>
                                    <label>{field.name}:</label>
                                    <p className="static-field-value">{displayValue}</p>
                                </div>
                            );
                        }

                        return (
                            <div className="form-group-user" key={index}>
                                <label>{field.isRequired && <span className="required-asterisk">*</span>} {field.name}:</label>
                                
                                {inputType === 'select' ? (
                                    <select 
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleFieldChange(field, e.target.value)}
                                            className="form-input-doc-create"
                                            required={field.isRequired}
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
                                            maxLength={maxLen}
                                            placeholder={`Ingrese ${field.name}...`}
                                            className="form-input-doc-create"
                                            required={field.isRequired}
                                    />
                                
                                ) : inputType === 'checkbox' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                                        <input 
                                            type="checkbox"
                                            checked={!!formData[field.name]}
                                            onChange={(e) => handleFieldChange(field, e.target.checked)}
                                            className="form-input-doc-create"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }}
                                        />
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            {formData[field.name] ? 'Sí' : 'No'}
                                        </span>
                                    </div>

                                ) : (
                                    <input 
                                            type={inputType}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleFieldChange(field, e.target.value)}
                                            step={inputType === 'number' ? stepValue : undefined}
                                            maxLength={maxLen}
                                            placeholder={`Ingrese ${field.name}...`}
                                            className="form-input-doc-create"
                                            required={field.isRequired}
                                    />
                                )}
                            </div>
                        );
                    })}
                    
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
                                                {documentType.name} Anexo.pdf
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
                                                rel="noreferrer"
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