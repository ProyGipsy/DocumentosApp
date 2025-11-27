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

const initialField = { 
    id: generateTempId(),
    fieldName: '', 
    fieldType: 'char',
    specificValues: [], // Para guardar los valores cuando es tipo lista
    fieldLength: 0,
    fieldPrecision: 0,
    isNew: false,
};

const CreateDocumentType = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Útil para redirigir después de guardar

    // Recibimos estado desde la navegación anterior (ej. lista de documentos)
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
                    // Usamos GET con parámetros query
                    const params = new URLSearchParams({ id: folderId });
                    const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                    
                    if (!response.ok) throw new Error('Error al obtener datos del servidor');
                    
                    const data = await response.json();

                    // 1. Llenar inputs de cabecera
                    setDocumentTypeId(data.id);
                    setDocumentTypeName(data.name);
                    setDocumentTypeAlias(data.alias);
                    setDocumentTypeDescription(data.description || '');

                    // 2. Mapear campos de la API (name, type) a los del Estado Local (fieldName, fieldType)
                    if (data.fields && data.fields.length > 0) {
                        const mappedFields = data.fields.map(f => ({
                            id: f.id || generateTempId(), // ID real o temporal
                            fieldName: f.name,
                            fieldType: f.type,
                            fieldLength: f.length || 0,
                            fieldPrecision: f.precision || 0,
                            specificValues: f.specificValues || [] 
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
                // Modo Creación: Limpiar todo
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
            { ...initialField, id: generateTempId(), isNew: true } // ID único temporal
        ]);
    };

    const handleRemoveField = (id) => {
        if (fields.length > 1) {
            setFields(prevFields => prevFields.filter(field => field.id !== id));
        } else {
            alert("El documento debe tener al menos un campo.");
        }
    };

    const handleFieldChange = (id, event) => {
        const { name, value } = event.target;
        
        // Detectar si cambió a 'specificValues' para abrir modal
        if (name === 'fieldType' && value === 'specificValues') {
            const fieldToEdit = fields.find(f => f.id === id);
            // Actualizamos estado temporalmente antes de abrir modal
            const updatedField = { ...fieldToEdit, [name]: value };
            setCurrentField(updatedField);
            setIsModalOpen(true);
        }

        setFields(prevFields => 
            prevFields.map(field => 
                field.id === id ? { ...field, [name]: value } : field
            )
        );
    };

    // --- MANEJADORES DEL MODAL ---

    const handleOpenModalForEdit = (field) => {
        if (field.fieldType === 'specificValues') {
            setCurrentField(field);
            setIsModalOpen(true);
        }
    };

    const handleSaveSpecificValues = (fieldId, values) => {
        // Guardar los valores que vienen del Modal en el estado de la tabla
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
        
        // Validaciones básicas
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
            alert("Todos los campos deben tener un nombre.");
            return;
        }

        // Preparar objeto para el Backend (Transformar de vuelta al formato API)
        const documentTypeData = {
            id: isEditing ? documentTypeId : null,
            name: documentTypeName,
            alias: documentTypeAlias, 
            description: documentTypeDescription,
            fields: fields.map(f => { 

                const isTempId = typeof f.id === 'string' && f.id.startsWith('temp-');

                return {
                    id: isTempId ? null : f.id, 
                    name: f.fieldName, 
                    type: f.fieldType,
                    precision: parseInt(f.fieldPrecision) || 0,
                    length: parseInt(f.fieldLength) || 0,
                    specificValues: f.specificValues
                };
            })
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
            navigate('/'); // Volver al listado

        } catch (error) {
            console.error('Error al guardar:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERIZADO ---

    /*
    if (isLoading) {
        return (
            <LayoutBase activePage="documentType">
                <div className="loading-container" style={{ padding: '50px', textAlign: 'center' }}>
                    <h3>Cargando información del documento...</h3>
                </div>
            </LayoutBase>
        );
    }
    */

    return (
        <LayoutBase activePage="documentType">
            <div className="document-type-wrapper-page"> 
                
                <div className="cardContainerDocType"> 
                    <h2 className="main-title">
                        {isEditing ? 'Editar Tipo de Documento' : 'Creación de Tipo de Documento'} 
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="document-type-form">
                        
                        {/* --- SECCIÓN 1: DATOS GENERALES --- */}
                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeName">
                                Nombre del Tipo de Documento <span className="required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                id="docTypeName"
                                value={documentTypeName}
                                onChange={(e) => setDocumentTypeName(e.target.value)}
                                placeholder="Ej: Factura de Venta"
                                className="text-input"
                                required
                            />
                        </div>

                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeAlias">
                                Alias (Siglas) <span className="required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                id="docTypeAlias"
                                value={documentTypeAlias}
                                onChange={(e) => setDocumentTypeAlias(e.target.value)}
                                placeholder="Ej: FACV"
                                className="text-input"
                                required
                            />
                        </div>

                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeDescription">Descripción</label>
                            <textarea
                                id="docTypeDescription"
                                value={documentTypeDescription}
                                onChange={(e) => setDocumentTypeDescription(e.target.value)}
                                placeholder="Breve descripción..."
                                className="text-input textarea-input"
                                rows="3"
                            />
                        </div>

                        {/* --- SECCIÓN 2: TABLA DE CAMPOS --- */}
                        <div className="fields-table-section">
                            <h3 className="section-subtitle">Campos del Documento</h3>

                            <div className="button-group-table">
                                <button 
                                    type="button" 
                                    onClick={handleAddField} 
                                    className="add-field-button"
                                >
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
                                            <th></th> {/* Acciones */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field) => (
                                            <tr key={field.id}>
                                                
                                                {/* Nombre */}
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="fieldName"
                                                        value={field.fieldName}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        placeholder="Nombre"
                                                        className="table-input"
                                                        required
                                                    />
                                                </td>
                                                
                                                {/* Tipo (Select) */}
                                                <td>
                                                    <div className="select-with-edit">
                                                        <select
                                                            name="fieldType"
                                                            value={field.fieldType}
                                                            onChange={(e) => handleFieldChange(field.id, e)}
                                                            className="table-select"
                                                        >
                                                            <option value="char">Caracter (1 Letra)</option>
                                                            <option value="date">Fecha (DD/MM/AAAA)</option>
                                                            <option value="bool">Marcar Sí o No</option>
                                                            <option value="int">Número Entero</option>
                                                            <option value="float">Número Decimal</option>
                                                            <option value="text">Texto Corto</option>
                                                            <option value="textarea">Texto Largo</option>
                                                            <option value="specificValues">Valores Específicos</option>
                                                        </select>

                                                        {/* Botón Editar Valores (Solo si es specificValues) */}
                                                        {field.fieldType === 'specificValues' && (
                                                            <button
                                                                type="button"
                                                                className="edit-values-button"
                                                                onClick={() => handleOpenModalForEdit(field)}
                                                                title="Editar valores de la lista"
                                                            >
                                                                <img src={edit} alt="Editar" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Longitud */}
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="fieldLength"
                                                        value={field.fieldLength}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        className="table-input"
                                                        min="0"
                                                    />
                                                </td>

                                                {/* Precisión */}
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="fieldPrecision"
                                                        value={field.fieldPrecision}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        className="table-input"
                                                        min="0"
                                                    />
                                                </td>

                                                {/* Eliminar */}
                                                <td className="actions-cell-doc-type">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveField(field.id)}
                                                        className="remove-field-button icon-button"
                                                        disabled={fields.length === 1 || (!field.isNew)}
                                                        title="Eliminar campo"
                                                    >
                                                        <img src={trash} alt="Eliminar" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- BOTÓN GUARDAR --- */}
                        <div className="form-footer-buttons">
                            <button type="submit" className="save-document-type-button" disabled={isLoading}>
                                {
                                    isLoading ? 'Guardando cambios' : (isEditing ? 'Actualizar Tipo de Documento' : 'Guardar Tipo de Documento')
                                }
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* --- MODAL --- */}
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