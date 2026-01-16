import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';

// --- Configuración de API ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ContactsModal = ({ isOpen, onClose, mode = 'add', contact = null, onSave, userId = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    id: '',
    alias: '',
    emails: [], // Array de correos
  });

  // Estado temporal para el input de correo actual
  const [currentEmailInput, setCurrentEmailInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && contact) {
        setFormData({
          id: contact.id || '',
          alias: contact.alias || '',
          emails: Array.isArray(contact.emails) ? contact.emails : [],
        });
      } else {
        setFormData({ id: '', alias: '', emails: [] });
      }
      setCurrentEmailInput(''); // Limpiar input temporal
    }
  }, [isOpen, mode, contact]);

  if (!isOpen) return null;

  // --- Manejo de Inputs de Texto (Alias) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA PARA AGREGAR CORREOS (CHIPS) ---
  const handleEmailKeyDown = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      
      const email = currentEmailInput.trim();
      // Regex simple para validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && emailRegex.test(email)) {
        if (!formData.emails.includes(email)) {
          setFormData(prev => ({
            ...prev,
            emails: [...prev.emails, email]
          }));
          setCurrentEmailInput(''); // Limpiar input
        } else {
            alert("Este correo ya está en la lista.");
        }
      } else if (email) {
        alert("Por favor, ingrese un correo válido.");
      }
    }
  };

  const removeEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== emailToRemove)
    }));
  };

  // --- GUARDAR ---
  const handleSave = async () => {
    setIsLoading(true);

    // 1. Validaciones básicas
    if (!userId) {
        alert('Error: No se identificó el usuario actual.');
        setIsLoading(false);
        return;
    }

    if (!formData.alias.trim()) {
      alert('Por favor, ingrese un Alias.');
      setIsLoading(false);
      return;
    }

    if (formData.emails.length === 0) {
        alert('Debe agregar al menos un correo electrónico.');
        setIsLoading(false);
        return;
    }

    // 2. Preparar Payload
    const contactToSave = {
      id: formData.id, 
      alias: formData.alias,
      emails: formData.emails,
      userId: userId, // Esencial para el backend
    };

    try {
        let url = mode === 'add' 
            ? `${apiUrl}/documents/createContact` 
            : `${apiUrl}/documents/updateContact`;
            
        let method = mode === 'add' ? 'POST' : 'PUT';
        
        // 3. Llamada al Backend
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactToSave)
        });

        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición al servidor');
        }
       
       // 4. Actualizar UI
       // Si es creación, el backend nos devuelve el ID nuevo en data.id
       const finalContactData = {
           ...contactToSave,
           id: data.id || contactToSave.id 
       };

       onSave(finalContactData, mode);
       onClose(); // Cerramos el modal solo si todo salió bien

    } catch (error) {
      console.error("Error saving contact:", error);
      alert('Error al guardar el contacto: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay-user" onClick={onClose}>
      <div className="modal-content-user" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header-user">
          <h3>{mode === 'edit' ? 'Editar Contacto' : 'Agregar Contacto'}</h3>
          <button className="close-button-user" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body-user">
          
          {/* Campo Alias */}
          <div className="form-group-user">
            <label>Alias <span className="required-asterisk">*</span></label>
            <input
              type="text"
              name="alias"
              className="form-input-doc-create"
              value={formData.alias}
              onChange={handleChange}
              placeholder="Ej: Proveedor Principal"
              autoFocus
            />
          </div>

          {/* Campo Correos (Tipo Chips) */}
          <div className="form-group-user">
            <label>Correos Electrónicos <span className="required-asterisk">*</span></label>
            <small style={{display:'block', color:'#666', marginBottom:'5px'}}>
                Escriba el correo y presione <b>Enter</b> o <b>Coma</b> para agregarlo.
            </small>
            
            <input
              type="text"
              className="form-input-doc-create"
              value={currentEmailInput}
              onChange={(e) => setCurrentEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder="nuevo@correo.com"
            />

            {/* Contenedor de Chips */}
            <div style={{ 
                marginTop: '10px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                justifyContent: 'flex-start'
            }}>
                {formData.emails.map((email, index) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: '#f0f0f0', 
                        border: '1px solid #ddd',
                        borderRadius: '15px', 
                        padding: '4px 10px',
                        fontSize: '13px',
                        color: '#333'
                    }}>
                        {email}
                        <span 
                            onClick={() => removeEmail(email)}
                            style={{ 
                                marginLeft: '8px', 
                                cursor: 'pointer', 
                                fontWeight: 'bold', 
                                color: '#999',
                                display: 'flex', 
                                alignItems: 'center'
                            }}
                            title="Eliminar correo"
                            onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
                            onMouseLeave={(e) => e.target.style.color = '#999'}
                        >
                            &times;
                        </span>
                    </div>
                ))}
            </div>
          </div>

        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSave} disabled={isLoading}>
            {isLoading 
                ? (mode === 'edit' ? 'Guardando...' : 'Agregando...') 
                : (mode === 'edit' ? 'Guardar Cambios' : 'Agregar Contacto')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;