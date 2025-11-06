import React, { useState, useEffect } from 'react';
// Asume que esta ruta apunta al icono de basura que estás usando
import trash from '../../assets/img/trash.png'; 
// Reutilizamos estilos del modal de usuario para la base
import '../../styles/general/sendDocModal.css'; 
// Asume que necesitas estilos específicos para la tabla de valores

const createEmptyItem = () => ({ id: Date.now() + Math.random(), value: '' });

const SpecificValuesModal = ({ isOpen, onClose, field, onSaveValues }) => {
    // Inicializa el estado con los valores existentes del campo, o con un campo inicial vacío
    const [specificValues, setSpecificValues] = useState(() =>
        field && field.specificValues && field.specificValues.length > 0
            ? field.specificValues.map(v => ({ id: Date.now() + Math.random(), value: v }))
            : [createEmptyItem()]
    );

    // Sincroniza el estado del modal cuando se abre o el 'field' cambia
    useEffect(() => {
        if (isOpen) {
            setSpecificValues(
                field && field.specificValues && field.specificValues.length > 0
                    ? field.specificValues.map(v => ({ id: Date.now() + Math.random(), value: v }))
                    : [createEmptyItem()]
            );
        }
    }, [isOpen, field]);

    // Maneja la adición de un nuevo valor al array: agrega una fila vacía para que el usuario la complete
    const handleAddValue = () => {
        setSpecificValues(prevValues => [
            ...prevValues,
            createEmptyItem()
        ]);
    };

    // Maneja el cambio de un valor existente en la tabla
    const handleValueChange = (id, event) => {
        const { value } = event.target;
        setSpecificValues(prevValues => 
            prevValues.map(item => 
                item.id === id ? { ...item, value } : item
            )
        );
    };

    // Maneja la eliminación de un valor
    const handleRemoveValue = (id) => {
        // Permitimos eliminar incluso la única fila, ya que se puede agregar una nueva
        setSpecificValues(prevValues => prevValues.filter(item => item.id !== id));
    };

    // Guarda los valores y cierra el modal
    const handleSave = () => {
        // Filtra valores vacíos y extrae solo el string de valor
        const finalValues = specificValues
            .filter(item => item.value.trim() !== '')
            .map(item => item.value.trim());

        // Si no hay valores, se establece un array vacío y se notifica al usuario
        if (finalValues.length === 0) {
            alert("No se guardaron valores específicos. El campo quedará sin valores definidos.");
        }
        
        // Llama a la función de guardado en el componente padre (CreateDocumentType)
        onSaveValues(field.id, finalValues);
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="modal-overlay-user">
            <div className="modal-content-user" style={{ maxWidth: '600px' }}>
                <div className="modal-header-user">
                    <h3>Definir Valores Específicos para: {field.fieldName || 'Nuevo Campo'}</h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
                    Los valores ingresados se mostrarán como las opciones disponibles para este campo {field.fieldName || 'Nuevo Campo'} del tipo de documento.
                </small>

                <div className="button-group-table">
                    <button 
                        type="button" 
                        onClick={handleAddValue} 
                        className="add-field-button"
                    >
                        + Agregar Valor
                    </button>
                </div>

                <table className="fields-table specific-values-table">
                    <tbody>
                        {specificValues.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={item.value}
                                        onChange={(e) => handleValueChange(item.id, e)}
                                        className="table-input"
                                        placeholder="Ingrese un valor para el campo"
                                    />
                                </td>
                                <td className="actions-cell-doc-type">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveValue(item.id)}
                                        className="remove-field-button icon-button"
                                    >
                                        <img src={trash} alt="Eliminar" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {specificValues.length === 0 && (
                            <tr><td colSpan="2" style={{ textAlign: 'center', color: '#6c757d' }}>No hay valores definidos. Añade uno.</td></tr>
                        )}
                    </tbody>
                </table>

                <div className="modal-footer-user">
                    <button className="modal-button-user save-button-user" onClick={handleSave}>
                        Guardar Valores
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecificValuesModal;