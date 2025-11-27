import React, { useState, useEffect } from 'react';
import trash from '../../assets/img/trash.png'; 
import '../../styles/general/sendDocModal.css'; 

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const createEmptyItem = () => ({ id: generateTempId(), value: '' });

const SpecificValuesModal = ({ isOpen, onClose, field, onSaveValues }) => {
    
    // Función auxiliar para normalizar los valores al abrir el modal
    const mapInitialValues = (values) => {
        if (!values || values.length === 0) return [createEmptyItem()];

        return values.map(v => {
            // CORRECCIÓN AQUÍ:
            // Si 'v' es un objeto (viene de BD), extraemos v.value.
            // Si 'v' es un string (viene de edición local reciente), usamos 'v'.
            const valString = (typeof v === 'object' && v !== null) ? v.value : v;
            
            return { 
                id: generateTempId(), // Generamos IDs temporales para la UI del modal
                value: valString 
            };
        });
    };

    // Inicializa el estado
    const [specificValues, setSpecificValues] = useState(() => 
        field ? mapInitialValues(field.specificValues) : [createEmptyItem()]
    );

    // Sincroniza el estado cuando se abre el modal
    useEffect(() => {
        if (isOpen && field) {
            setSpecificValues(mapInitialValues(field.specificValues));
        }
    }, [isOpen, field]);

    // ... (El resto de tus funciones handleAddValue, handleRemoveValue, etc. quedan IGUAL) ...
    const handleAddValue = () => {
        setSpecificValues(prevValues => [
            ...prevValues,
            createEmptyItem()
        ]);
    };

    const handleValueChange = (id, event) => {
        const { value } = event.target;
        setSpecificValues(prevValues => 
            prevValues.map(item => 
                item.id === id ? { ...item, value } : item
            )
        );
    };

    const handleRemoveValue = (id) => {
        setSpecificValues(prevValues => prevValues.filter(item => item.id !== id));
    };

    const handleSave = () => {
        // Filtramos vacíos
        const finalValues = specificValues
            .filter(item => item.value.trim() !== '')
            .map(item => {
                return { value: item.value.trim() }; 
            });

        if (finalValues.length === 0) {
            alert("Advertencia: No se guardaron valores. El campo quedará vacío.");
        }
        
        onSaveValues(field.id, finalValues);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-user">
            <div className="modal-content-user" style={{ maxWidth: '600px' }}>
                <div className="modal-header-user">
                    <h3>Definir Valores: {field.fieldName || 'Nuevo Campo'}</h3>
                    <button className="close-button-user" onClick={onClose}>&times;</button>
                </div>

                <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
                    Defina las opciones disponibles para este campo.
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

                <div className="fields-table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
                    <table className="fields-table specific-values-table">
                        <tbody>
                            {specificValues.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.value} // Ahora esto será un string seguro
                                            onChange={(e) => handleValueChange(item.id, e)}
                                            className="table-input"
                                            placeholder="Ingrese opción..."
                                            autoFocus={item.value === ''} // UX: Enfocar si está vacío
                                        />
                                    </td>
                                    <td className="actions-cell-doc-type" style={{width: '50px'}}>
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
                                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '10px' }}>No hay valores. Pulse "Agregar Valor".</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="modal-footer-user">
                    <button className="modal-button-user save-button-user" onClick={handleSave}>
                        Guardar y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecificValuesModal;