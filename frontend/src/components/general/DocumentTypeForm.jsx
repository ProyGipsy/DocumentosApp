import React, { useState } from 'react';
import LayoutBase from '../base/LayoutBase'; 
import '../../styles/general/documentTypeForm.css'; 
import trash from '../../assets/img/trash.png';
import edit from '../../assets/img/edit.png';
import SpecificValuesModal from './SpecificValuesModal';

const initialField = { 
    id: Date.now(),
    fieldName: '', 
    fieldType: 'char',
    specificValues: [],
};

const CreateDocumentType = () => {
    const [documentTypeName, setDocumentTypeName] = useState('');
    const [documentTypeAlias, setDocumentTypeAlias] = useState('');
    const [fields, setFields] = useState([initialField]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentField, setCurrentField] = useState(null);


    const handleAddField = () => {
        setFields(prevFields => [
            ...prevFields,
            { id: Date.now(), fieldName: '', fieldType: 'text' }
        ]);
    };

    const handleRemoveField = (id) => {
        if (fields.length > 1) {
            setFields(prevFields => prevFields.filter(field => field.id !== id));
        } else {
            alert("No puedes eliminar la última fila de campos.");
        }
    };

    const handleFieldChange = (id, event) => {
        const { name, value } = event.target;
        
        if (name === 'fieldType' && value === 'specificValues') {
            const fieldToEdit = fields.find(f => f.id === id);
            setCurrentField(fieldToEdit);
            setIsModalOpen(true);
        }

        setFields(prevFields => 
            prevFields.map(field => 
                field.id === id ? { ...field, [name]: value } : field
            )
        );
    };

    const handleSaveSpecificValues = (fieldId, values) => {
        setFields(prevFields => 
            prevFields.map(field => 
                field.id === fieldId ? { ...field, specificValues: values } : field
            )
        );
        setCurrentField(null);
    };

    const handleOpenModalForEdit = (field) => {
        if (field.fieldType === 'specificValues') {
            setCurrentField(field);
            setIsModalOpen(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!documentTypeName.trim()) {
            alert("Por favor, ingrese el nombre del Tipo de Documento.");
            return;
        }
        const fieldsAreValid = fields.every(field => field.fieldName.trim());
        if (!fieldsAreValid) {
            alert("Todos los nombres de campo son requeridos.");
            return;
        }

        const documentTypeData = {
            name: documentTypeName,
            fields: fields.map(f => ({ name: f.fieldName, type: f.fieldType }))
        };

        console.log("Datos a enviar al API:", documentTypeData);
        alert(`Tipo de Documento "${documentTypeName}" y ${fields.length} campos listos para enviar.`);
        // Aquí iría la llamada API
    };

    return (
        <LayoutBase activePage="documentType">
            <div className="document-type-wrapper-page"> 
                {/* Contenedor de la tarjeta blanca */}
                <div className="cardContainerDocType"> 
                    
                    <h2 className="main-title">Creación de Tipo de Documento</h2>
                    <form onSubmit={handleSubmit} className="document-type-form">
                        
                        {/* Input 1: Nombre del Tipo de Documento */}
                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeName">
                                Nombre del Tipo de Documento <span className="required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                id="docTypeName"
                                value={documentTypeName}
                                onChange={(e) => setDocumentTypeName(e.target.value)}
                                placeholder="Ej: Registro Único de Información Fiscal (RIF)"
                                className="text-input"
                                required
                            />
                        </div>

                        {/* Input 2: Alias del Tipo de Documento */}
                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeAlias">
                                Alias (Siglas) del Tipo de Documento <span className="required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                id="docTypeAlias"
                                value={documentTypeAlias}
                                onChange={(e) => setDocumentTypeAlias(e.target.value)}
                                placeholder="Ej: RIF"
                                className="text-input"
                                required
                            />
                        </div>

                        {/* Input 3: Descripción (Agregado para coincidir con la imagen) */}
                        <div className="form-group-doc-type">
                            <label htmlFor="docTypeDescription">
                                Descripción del Tipo de Documento
                            </label>
                            <textarea
                                id="docTypeDescription"
                                name="docTypeDescription"
                                placeholder="Ej: Documento obligatorio de identificación tributaria asignado por el SENIAT"
                                className="text-input textarea-input"
                                rows="3"
                            />
                        </div>

                        {/* Sección 3: Campos del Documento (Tabla Dinámica) */}
                        <div className="fields-table-section">
                            <h3 className="section-subtitle">Campos del Tipo de Documento</h3>

                            {/* Botón para Añadir Campo */}
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
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, index) => (
                                            <tr key={field.id}>
                                                {/* Columna 1: Nombre del Campo */}
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="fieldName"
                                                        value={field.fieldName}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        placeholder="Ej: RIF, Nombre Cliente, Monto"
                                                        className="table-input"
                                                        required
                                                    />
                                                </td>
                                                
                                                {/* Columna 2: Tipo de Dato (Select) */}
                                                <td>
                                                    <div className="select-with-edit"> {/* Contenedor para el select y el botón */}
                                                        <select
                                                            name="fieldType"
                                                            value={field.fieldType}
                                                            onChange={(e) => handleFieldChange(field.id, e)}
                                                            className="table-select"
                                                        >
                                                            <option value="char">Caracter (Letra)</option>
                                                            <option value="date">Fecha</option>
                                                            <option value="bool">Marcar Sí o No</option>
                                                            <option value="int">Número Entero</option>
                                                            <option value="float">Número Decimal</option>
                                                            <option value="text">Texto Corto</option>
                                                            <option value="textarea">Texto Largo (Párrafo)</option>
                                                            <option value="specificValues">Valores Específicos</option>
                                                        </select>

                                                        {/* Botón de editar si el tipo es Valores Específicos */}
                                                        {field.fieldType === 'specificValues' && (
                                                            <button
                                                                type="button"
                                                                className="edit-values-button"
                                                                onClick={() => handleOpenModalForEdit(field)}
                                                            >
                                                                <img src={edit} alt="Editar Valores" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Columna 3: Longitud */}
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="fieldPrecision"
                                                        value={field.fieldPrecision}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        placeholder="0"
                                                        className="table-input"
                                                        required
                                                    />
                                                </td>

                                                {/* Columna 4: Precisión */}
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="fieldLength"
                                                        value={field.fieldLength}
                                                        onChange={(e) => handleFieldChange(field.id, e)}
                                                        placeholder="0"
                                                        className="table-input"
                                                        required
                                                    />
                                                </td>

                                                {/* Columna 5: Acciones (Eliminar) */}
                                                <td className="actions-cell-doc-type">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveField(field.id)}
                                                        className="remove-field-button icon-button"
                                                        disabled={fields.length === 1}
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

                        {/* Botón de Guardar */}
                        <div className="form-footer-buttons">
                            <button type="submit" className="save-document-type-button">
                                Guardar Tipo de Documento
                            </button>
                        </div>
                    </form>
                </div>
                {currentField && (
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