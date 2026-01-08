import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';
import { useAuth } from '../../utils/AuthContext';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const SendDocumentModal = ({ isOpen, onClose, selectedDocuments, selectedDocumentNames, onSend, isLoading=true }) => {
  
  const initialFormState = {
    senderName: '',      
    recipientName: '',   
    recipients: '',      
    subject: 'Envío de Documentos', 
    body: ''             
  };

  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [availableEmails, setAvailableEmails] = useState([]); // Lista total traída de la API
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Lista filtrada según lo que escribe
  const [showSuggestions, setShowSuggestions] = useState(false); // Controlar visibilidad

  useEffect(() => {
    if (isOpen && user?.id) {
      setFormData(initialFormState);
      
      const fetchEmails = async () => {
        try {
            const response =  await fetch(`${apiUrl}/documents/getSuggestedEmails?userId=${user.id}`);

            if (response.ok) {
              const data = await response.json();
              setAvailableEmails(data);
            }
        } catch (error) {
            console.error("Error cargando sugerencias de correo:", error);
        }
      };
      fetchEmails();
    }
  }, [isOpen, user]);

  // --- Lógica para filtrar sugerencias ---
  useEffect(() => {
    // 1. Obtenemos el texto actual
    const text = formData.recipients;
    
    // 2. Buscamos la última parte después de una coma (ej: "correo1, corr") -> " corr"
    const lastCommaIndex = text.lastIndexOf(',');
    const currentTerm = lastCommaIndex !== -1 
        ? text.substring(lastCommaIndex + 1).trim() 
        : text.trim();

    // 3. Si hay texto escribiéndose (mínimo 1 caracter), filtramos
    if (currentTerm.length > 0) {
        const matches = availableEmails.filter(email => 
            email.toLowerCase().includes(currentTerm.toLowerCase()) &&
            !text.includes(email) // Opcional: Evitar sugerir si ya está agregado
        );
        setFilteredSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    } else {
        setShowSuggestions(false);
    }
  }, [formData.recipients, availableEmails]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Manejador al hacer clic en una sugerencia ---
  const handleSelectSuggestion = (email) => {
    const text = formData.recipients;
    const lastCommaIndex = text.lastIndexOf(',');
    
    // Mantenemos todo lo que estaba antes de la última coma
    let prefix = lastCommaIndex !== -1 
        ? text.substring(0, lastCommaIndex + 1) 
        : '';
    
    // Agregamos espacio si hay prefijo
    if (prefix && !prefix.endsWith(' ')) prefix += ' ';

    // Actualizamos el input: Texto anterior + Email seleccionado + Coma y espacio
    setFormData(prev => ({
        ...prev,
        recipients: prefix + email + ', '
    }));

    setShowSuggestions(false);
    
    // Regresar el foco al input (opcional, requiere usar useRef en el input)
    document.getElementById('recipients').focus();
  };

  const handleSend = () => {
    // --- 1. Validaciones de Campos Vacíos ---
    if (!formData.senderName.trim()) {
      alert('Por favor, indique a nombre de quién se envían los documentos.');
      return;
    }
    if (!formData.recipientName.trim()) {
       alert('Por favor, indique a nombre de quién va dirigido.');
       return;
    }
    if (!formData.recipients.trim()) {
       alert('Por favor, indique los correos destinatarios.');
       return;
    }
    if (!formData.subject.trim()) {
       alert('Por favor, indique el asunto.');
       return;
    }

    // --- 2. Procesamiento de la lista de correos ---
    const emailList = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');

    // --- 3. VALIDACIÓN DE FORMATO (REGEX) ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
        alert(`Error de validación:\nLos siguientes correos no tienen un formato válido:\n\n${invalidEmails.join('\n')}\n\nPor favor, verifique que contengan "@" y un dominio (ej: .com).`);
        return; 
    }

    // --- 4. Preparar datos y Enviar ---
    const emailData = {
        senderName: formData.senderName,
        recipientName: formData.recipientName,
        recipients: emailList,
        subject: formData.subject,
        body: formData.body
    };

    console.log("Enviando datos al padre:", emailData);
    onSend(selectedDocuments, emailData);
  };

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user" onClick={e => e.stopPropagation()}>
        <div className="modal-header-user">
          <h3>Enviar {selectedDocuments.length} Documento{selectedDocuments.length !== 1 ? 's' : ''}</h3>
          <button className="close-button-user" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body-user">
          
          <div className="form-group-user">
            <label htmlFor="senderName">
              De <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="senderName"
              name="senderName"
              className="form-input-doc-create"
              required
              value={formData.senderName}
              onChange={handleChange}
              placeholder="Nombre del remitente"
            />
          </div>

           <div className="form-group-user">
            <label htmlFor="recipientName">
              Para (Nombre) <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              className="form-input-doc-create"
              required
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Nombre del destinatario"
            />
          </div>

          {/* --- MODIFICADO: Contenedor relativo para posicionar la lista --- */}
          <div className="form-group-user" style={{ position: 'relative' }}>
            <label htmlFor="recipients">
              Correos Destinatarios <span className="required-asterisk">*</span>
            </label>
            <small style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.85em' }}>
              Separe los correos con comas. Seleccione de la lista o escriba uno nuevo.
            </small>
            <input
              type="text"
              id="recipients"
              name="recipients"
              className="form-input-doc-create"
              required
              value={formData.recipients}
              onChange={handleChange}
              placeholder="ejemplo@correo.com, otro@correo.com"
              autoComplete="off"
            />
            
            {/* --- NUEVO: Lista de Sugerencias Flotante --- */}
            {showSuggestions && (
                <ul className="suggestions-list" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {filteredSuggestions.map((email, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleSelectSuggestion(email)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                fontSize: '0.9em',
                                color: '#333'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                            {email}
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="form-group-user">
            <label htmlFor="subject">
              Asunto <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-input-doc-create"
              required
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-user">
            <label htmlFor="body">Mensaje</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows="4"
              placeholder="Escriba un mensaje opcional..."
              className="textarea-modal form-input-doc-create"
            />
          </div>

          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
            <strong style={{fontSize: '0.9em', color: '#333'}}>Archivos adjuntos:</strong>
            <ul style={{ margin: '5px 0 0 20px', padding: 0, fontSize: '0.85em', color: '#555' }}>
                {selectedDocumentNames.map((name, idx) => (
                    <li key={idx}>{name}</li>
                ))}
            </ul>
          </div>

        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Confirmar Envío'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDocumentModal;