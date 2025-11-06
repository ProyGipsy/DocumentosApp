// DocumentFieldsModal.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css'; 


// --- Tipos de Datos ---
const MOCK_DATA_TYPES = [
    { id: 'text-short', label: 'Texto Corto', inputType: 'text' },
    { id: 'text-long', label: 'Texto Largo', inputType: 'textarea' },
    { id: 'integer', label: 'Número Entero', inputType: 'number', precision: 0 },
    { id: 'decimal', label: 'Número Decimal', inputType: 'number', precision: 2 },
    { id: 'date', label: 'Fecha', inputType: 'date' },
    { id: 'specific-values', label: 'Valores Específicos', inputType: 'select' },
];


const DocumentFieldsModal = ({ isOpen, onClose, company, documentType, onSaveDocument }) => {
    const [formData, setFormData] = useState({}); 
    const [attachment, setAttachment] = useState(null);

    // Reinicia el estado cada vez que el modal se abre o el tipo de documento cambia
    useEffect(() => {
        if (isOpen && documentType) {
            const initialData = documentType.fields.reduce((acc, field) => {
                acc[field.name] = '';
                return acc;
            }, {});
            setFormData(initialData);
            setAttachment(null);
        }
    }, [isOpen, documentType]);


    if (!isOpen || !documentType) return null;
    
    const getFieldInputType = (field) => {
        const dataType = MOCK_DATA_TYPES.find(dt => dt.id === field.typeId);
        return dataType ? dataType.inputType : 'text'; 
    };

    const handleFieldChange = (fieldName, value) => {
        setFormData(prevData => ({
            ...prevData,
            [fieldName]: value
        }));
    };

    const handleFileChange = (event) => {
        setAttachment(event.target.files[0]);
    };
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!attachment) {
            alert('Debe adjuntar el archivo .pdf anexo.');
            return;
        }

        // Simulación de guardar
        const documentToSave = {
            docTypeId: documentType.id,
            docTypeName: documentType.name,
            companyId: company.id,
            companyName: company.name,
            fieldsData: formData,
            attachment: attachment.name,
            fileObject: attachment
        };

        onSaveDocument(documentToSave);
        onClose();
    };

    return (
        <div className="modal-overlay-user" onClick={onClose}>
            <div
                className="modal-content-user"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header-user">
                    <h3>Campos del Documento: <span style={{color: '#8b56ed'}}>{documentType.name}</span></h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-body-user" onSubmit={handleSubmit}>
                    {documentType.fields.map((field, index) => {
                        const inputType = getFieldInputType(field);
                        const isSpecificValues = field.typeId === 'specific-values';
                        
                        const precision = MOCK_DATA_TYPES.find(dt => dt.id === field.typeId)?.precision || 0;
                        const stepValue = inputType === 'number' && precision > 0 ? `0.${'0'.repeat(precision - 1)}1` : undefined;

                        return (
                            <div className="form-group-user" key={index}>
                                <label><span className="required-asterisk">*</span> {field.name}:</label>
                                
                                {inputType === 'select' && isSpecificValues ? (
                                    <select 
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Seleccione un valor</option>
                                        {field.specificValues.map((value, idx) => (
                                            <option key={idx} value={value}>{value}</option>
                                        ))}
                                    </select>
                                
                                ) : inputType === 'textarea' ? (
                                    <textarea
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        rows="3"
                                        required
                                        placeholder={`Ingrese ${field.name}...`}
                                    />
                                
                                ) : (
                                    <input 
                                        type={inputType}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        step={stepValue}
                                        required
                                        placeholder={`Ingrese ${field.name}...`}
                                    />
                                )}
                            </div>
                        );
                    })}
                    
                    <div className="form-group-user file-upload-group">
                        <label>
                            <span className="required-asterisk">*</span> Anexo:
                        </label>
                        <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
                            Cargue un archivo .pdf como anexo del documento.
                        </small>
                        <input 
                            type="file"
                            accept=".pdf"
                            className="form-input-doc-create file-input"
                            onChange={handleFileChange}
                            required
                        />
                    </div>

                    <div className="modal-footer-user">
                        <button type="submit" className="modal-button-user save-button-user">
                            Crear Documento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentFieldsModal;