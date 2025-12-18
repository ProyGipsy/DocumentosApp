import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LayoutBase from '../base/LayoutBase'; 
import '../../styles/general/documentTypeForm.css'; 
import trash from '../../assets/img/trash.png';
import edit from '../../assets/img/edit.png';
import SpecificValuesModal from './SpecificValuesModal';

// Configuración de URL según entorno
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 1. MODIFICACIÓN: Agregamos isRequired: false por defecto
const initialField = { 
    id: generateTempId(),
    fieldName: '', 
    fieldType: 'char',
    specificValues: [], 
    fieldLength: 0,
    fieldPrecision: 0,
    isRequired: false, // Inicializado en falso (0)
    isNew: false,
};

const CreateDocumentType = () => {
    const location = useLocation();
    const navigate = useNavigate(); 

    const { folderId, folderName, isEditing } = location.state || {};

    // --- ESTADOS ---
    const [isLoading, setIsLoading] = useState(false);
    
    // Datos del encabezado del documento
    const [documentTypeId, setDocumentTypeId] = useState(null);
    const [documentTypeName, setDocumentTypeName] = useState('');
    const [documentTypeAlias, setDocumentTypeAlias] = useState('');
    const [documentTypeDescription, setDocumentTypeDescription] = useState('');
    
    // Datos de la tabla (Campos)
    const [fields, setFields] = useState([initialField]);
    
    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    // --- EFECTO: CARGAR DATOS (SOLO EN EDICIÓN) ---
    useEffect(() => {
        const loadData = async () => {
            if (isEditing && folderName) {
                setIsLoading(true);
                try {
                    const params = new URLSearchParams({ id: folderId });
                    const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                    
                    if (!response.ok) throw new Error('Error al obtener datos del servidor');
                    
                    const data = await response.json();

                    setDocumentTypeId(data.id);
                    setDocumentTypeName(data.name);
                    setDocumentTypeAlias(data.alias);
                    setDocumentTypeDescription(data.description || '');

                    if (data.fields && data.fields.length > 0) {
                        const mappedFields = data.fields.map(f => ({
                            id: f.id || generateTempId(),
                            fieldName: f.name,
                            fieldType: f.type,
                            fieldLength: f.length || 0,
                            fieldPrecision: f.precision || 0,
                            specificValues: f.specificValues || [],
                            // 2. MODIFICACIÓN: Convertimos el 1/0 de la BD a true/false para React
                            isRequired: f.isRequired === 1 || f.isRequired === true 
                        }));
                        setFields(mappedFields);
                    }

                } catch (error) {
                    console.error("Error cargando documento:", error);
                    alert("No se pudo cargar la información del documento.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setDocumentTypeId(null);
                setDocumentTypeName('');
                setDocumentTypeAlias('');
                setDocumentTypeDescription('');
                setFields([initialField]);
            }
        };

        loadData();
    }, [isEditing, folderName]);

    // --- MANEJADORES DE LA TABLA ---

    const handleAddField = () => {
        setFields(prevFields => [
            ...prevFields,
            { ...initialField, id: generateTempId(), isNew: true } 
        ]);
    };

    const handleRemoveField = (id) => {
        if (fields.length > 1) {
            setFields(prevFields => prevFields.filter(field => field.id !== id));
        } else {
            alert("El documento debe tener al menos un campo personalizado.");
        }
    };

    const handleFieldChange = (id, event) => {
        // 3. MODIFICACIÓN: Extraemos 'checked' y 'type'
        const { name, value, type, checked } = event.target;
        
        // Si es checkbox usamos el booleano 'checked', si no el 'value'
        const valToUse = type === 'checkbox' ? checked : value;

        if (name === 'fieldType' && value === 'specificValues') {
            const fieldToEdit = fields.find(f => f.id === id);
            const updatedField = { ...fieldToEdit, [name]: valToUse };
            setCurrentField(updatedField);
            setIsModalOpen(true);
        }

        setFields(prev => prev.map(f => {
            if (f.id === id) {
                const updatedField = { ...f, [name]: valToUse };
                
                if (name === 'fieldType' && value !== 'float') {
                    if (value === 'char') {
                        updatedField.fieldLength = 1;
                    }
                    else {
                        updatedField.fieldLength = 0;
                        updatedField.fieldPrecision = 0;
                    }
                }
                
                return updatedField;
            }
            return f;
        }));
    };

    // --- MANEJADORES DEL MODAL ---
    const handleOpenModalForEdit = (field) => {
        if (field.fieldType === 'specificValues') {
            setCurrentField(field);
            setIsModalOpen(true);
        }
    };

    const handleSaveSpecificValues = (fieldId, values) => {
        setFields(prevFields => 
            prevFields.map(field => 
                field.id === fieldId ? { ...field, specificValues: values } : field
            )
        );
        setCurrentField(null);
    };

    // --- GUARDAR (SUBMIT) ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!documentTypeName.trim()) {
            alert("El nombre del Tipo de Documento es obligatorio.");
            return;
        }
        if (!documentTypeAlias.trim()) {
            alert("El Alias es obligatorio.");
            return;
        }

        const fieldsAreValid = fields.every(field => field.fieldName.trim() !== '');
        if (!fieldsAreValid) {
            alert("Todos los campos agregados deben tener un nombre.");
            return;
        }

        const processedDynamicFields = fields.map(f => { 
            const isTempId = typeof f.id === 'string' && f.id.startsWith('temp-');
            const finalPrecision = f.fieldType === 'float' ? (parseInt(f.fieldPrecision) || 0) : 0;
            const finalLength = f.fieldType === 'char' ? 1 : ((f.fieldType === 'date' || f.fieldType === 'bool' || f.fieldType === 'specificValues') ? 0 : parseInt(f.fieldLength) || 0);

            return {
                id: isTempId ? null : f.id, 
                name: f.fieldName, 
                type: f.fieldType,
                precision: finalPrecision,
                length: finalLength,
                specificValues: f.specificValues,
                // 4. MODIFICACIÓN: Convertimos true/false a 1/0 para la BD
                isRequired: f.isRequired ? 1 : 0 
            };
        });

        // INYECCIÓN DEL CAMPO OBLIGATORIO "Nombre del Documento"
        const nameFieldExists = processedDynamicFields.some(f => f.name.trim().toLowerCase() === "nombre del documento");
        
        let finalFieldsPayload = [...processedDynamicFields];

        if (!nameFieldExists) {
            const mandatoryField = {
                id: null, 
                name: "Nombre del Documento",
                type: "text",     
                length: 150,      
                precision: 0,
                specificValues: [],
                // 5. MODIFICACIÓN: El nombre siempre es obligatorio (1)
                isRequired: 1 
            };

            finalFieldsPayload = [mandatoryField, ...processedDynamicFields];
        }

        const documentTypeData = {
            id: isEditing ? documentTypeId : null,
            name: documentTypeName,
            alias: documentTypeAlias, 
            description: documentTypeDescription,
            fields: finalFieldsPayload 
        };

        console.log("Payload a enviar:", documentTypeData);
        setIsLoading(true);

        try {
            let url = isEditing ? `${apiUrl}/documents/editDocType` : `${apiUrl}/documents/createDocType`;
            let method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(documentTypeData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Error ${response.status}`);
            }

            alert('Tipo de Documento guardado correctamente.');
            navigate('/'); 

        } catch (error) {
            console.error('Error al guardar:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERIZADO ---
    return (
        <LayoutBase activePage="documentType">
            <div className="document-type-wrapper-page"> 
                
                <div className="cardContainerDocType"> 
                    <h2 className="main-title">
                        {isEditing ? 'Editar Tipo de Documento' : 'Creación de Tipo de Documento'} 
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="document-type-form">
                        
                        {/* --- DATOS GENERALES --- */}
                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeName">Nombre del Tipo de Documento <span className="required-asterisk">*</span></label>
                            <input type="text" id="docTypeName" value={documentTypeName} onChange={(e) => setDocumentTypeName(e.target.value)} placeholder="Ingrese el nombre completo" className="text-input" required />
                        </div>

                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeAlias">Alias (Siglas) <span className="required-asterisk">*</span></label>
                            <input type="text" id="docTypeAlias" value={documentTypeAlias} onChange={(e) => setDocumentTypeAlias(e.target.value)} placeholder="Ingrese el alias" className="text-input" required />
                        </div>

                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeDescription">Descripción</label>
                            <textarea id="docTypeDescription" value={documentTypeDescription} onChange={(e) => setDocumentTypeDescription(e.target.value)} placeholder="Breve descripción..." className="text-input textarea-input" rows="3" />
                        </div>

                        {/* --- TABLA DE CAMPOS --- */}
                        <div className="fields-table-section">
                            <h3 className="section-subtitle">Campos del Documento</h3>

                            <div className="button-group-table">
                                <button type="button" onClick={handleAddField} className="add-field-button">
                                    + Agregar Campo
                                </button>
                            </div>

                            <div className="fields-table-wrapper">
                                <table className="fields-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre del Campo</th>
                                            <th>Tipo de Dato</th>
                                            <th>Longitud</th>
                                            <th>Precisión</th>
                                            <th style={{ textAlign: 'center' }}>Obligatorio</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* --- CAMPO OBLIGATORIO FIJO (Visualmente Fijo) --- */}
                                        <tr style={{ backgroundColor: '#f0f4f8', borderBottom: '2px solid #ddd' }}>
                                            <td>
                                                <input type="text" value="Nombre del Documento" disabled className="table-input" style={{ fontWeight: 'bold', color: '#555', cursor: 'not-allowed' }} />
                                            </td>
                                            <td>
                                                <div className="select-with-edit">
                                                    <select disabled className="table-select" value="textarea" style={{ cursor: 'not-allowed', backgroundColor: '#e9ecef' }}>
                                                        <option value="textarea">Texto Largo</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td><input type="number" value="200" disabled className="table-input" style={{ cursor: 'not-allowed', backgroundColor: '#e9ecef' }} /></td>
                                            <td><input type="number" value="0" disabled className="table-input" style={{ cursor: 'not-allowed', backgroundColor: '#e9ecef' }} /></td>
                                            
                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={true} 
                                                    disabled 
                                                    title="Este campo siempre es obligatorio" 
                                                    style={{ transform: 'scale(1.2)', cursor: 'not-allowed' }}
                                                />
                                            </td>

                                            <td className="actions-cell-doc-type">
                                                <button type="button" disabled className="remove-field-button icon-button" style={{ opacity: 0.3, cursor: 'not-allowed' }}>
                                                    <img src={trash} alt="Bloqueado" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* --- CAMPOS DINÁMICOS --- */}
                                        {/* AQUI ESTÁ EL CAMBIO: Filtramos para que NO se renderice si ya viene del backend */}
                                        {fields
                                            .filter(field => field.fieldName.trim().toLowerCase() !== 'nombre del documento')
                                            .map((field) => {
                                            
                                            const isPrecisionDisabled = field.fieldType !== 'float' && field.fieldType !== 'money';
                                            const isLengthDisabled = field.fieldType === 'char' || field.fieldType === 'date' || field.fieldType === 'bool' || field.fieldType === 'specificValues'

                                            return (
                                            <tr key={field.id}>
                                                <td>
                                                    <input type="text" name="fieldName" value={field.fieldName} onChange={(e) => handleFieldChange(field.id, e)} placeholder="Nombre" className="table-input" required />
                                                </td>
                                                <td>
                                                    <div className="select-with-edit">
                                                        <select name="fieldType" value={field.fieldType} onChange={(e) => handleFieldChange(field.id, e)} className="table-select">
                                                            <option value="char">Caracter (1 Letra)</option>
                                                            <option value="date">Fecha (DD/MM/AAAA)</option>
                                                            <option value="bool">Marcar Sí o No</option>
                                                            <option value="money">Moneda</option>
                                                            <option value="int">Número Entero</option>
                                                            <option value="float">Número Decimal</option>
                                                            <option value="text">Texto Corto</option>
                                                            <option value="textarea">Texto Largo</option>
                                                            <option value="specificValues">Valores Específicos</option>
                                                        </select>
                                                        {field.fieldType === 'specificValues' && (
                                                            <button type="button" className="edit-values-button" onClick={() => handleOpenModalForEdit(field)} title="Editar valores">
                                                                <img src={edit} alt="Editar" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input type="number" name="fieldLength" value={field.fieldLength} onChange={(e) => handleFieldChange(field.id, e)} className="table-input" min="0" disabled={isLengthDisabled} style={{ backgroundColor: isLengthDisabled ? '#f5f5f5' : 'white', cursor: isLengthDisabled ? 'not-allowed' : 'text', color: isLengthDisabled ? '#aaa' : 'inherit' }} />
                                                </td>
                                                <td>
                                                    <input type="number" name="fieldPrecision" value={field.fieldPrecision} onChange={(e) => handleFieldChange(field.id, e)} className="table-input" min="0" disabled={isPrecisionDisabled} style={{ backgroundColor: isPrecisionDisabled ? '#f5f5f5' : 'white', cursor: isPrecisionDisabled ? 'not-allowed' : 'text', color: isPrecisionDisabled ? '#aaa' : 'inherit' }} />
                                                </td>
                                                
                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="isRequired"
                                                        checked={field.isRequired}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        title="Marcar si es obligatorio"
                                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                    />
                                                </td>

                                                <td className="actions-cell-doc-type">
                                                    <button type="button" onClick={() => handleRemoveField(field.id)} className="remove-field-button icon-button" disabled={(fields.length < 2) || !field.isNew && isEditing} title="Eliminar campo">
                                                        <img src={trash} alt="Eliminar" />
                                                    </button>
                                                </td>
                                            </tr>
                                            )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="form-footer-buttons">
                            <button type="submit" className="save-document-type-button" disabled={isLoading}>
                                {isLoading ? 'Guardando cambios' : (isEditing ? 'Actualizar Tipo de Documento' : 'Guardar Tipo de Documento')}
                            </button>
                        </div>
                    </form>
                </div>
                
                {isModalOpen && currentField && (
                    <SpecificValuesModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        field={currentField}
                        onSaveValues={handleSaveSpecificValues}
                    />
                )}
            </div>
        </LayoutBase>
    );
};

export default CreateDocumentType;