import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';

const SendDocumentModal = ({ isOpen, onClose, selectedDocuments, selectedDocumentNames, onSend, isLoading=true }) => {
  
  const initialFormState = {
    senderName: '',      
    recipientName: '',   
    recipients: '',      
    subject: 'Envío de Documentos', 
    body: ''             
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    // Esta expresión regular verifica:
    // ^[^\s@]+   : Texto antes del @ (sin espacios)
    // @          : Arroba obligatoria
    // [^\s@]+    : Dominio (ej: gmail, hotmail)
    // \.         : Un punto obligatorio
    // [^\s@]+$   : Extensión (ej: com, net, ve)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Filtramos los que NO cumplen con el formato
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
        alert(`Error de validación:\nLos siguientes correos no tienen un formato válido:\n\n${invalidEmails.join('\n')}\n\nPor favor, verifique que contengan "@" y un dominio (ej: .com).`);
        return; // Detenemos el envío
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
    <div className="modal-overlay-user" onClick={onClose}>
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

          <div className="form-group-user">
            <label htmlFor="recipients">
              Correos Destinatarios <span className="required-asterisk">*</span>
            </label>
            <small style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.85em' }}>
              Separe los correos con comas (ej: usuario1@gmail.com, usuario2@empresa.net)
            </small>
            <input
              type="text"
              id="recipients"
              name="recipients"
              className="form-input-doc-create"
              required
              value={formData.recipients}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
            />
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