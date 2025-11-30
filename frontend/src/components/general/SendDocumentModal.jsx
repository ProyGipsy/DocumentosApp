import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';

const SendDocumentModal = ({ isOpen, onClose, selectedDocuments, selectedDocumentNames, onSend }) => {
  
  // 1. CORRECCIÓN: Estado inicial coincidente con los inputs
  const initialFormState = {
    senderName: '',      // Campo 'From' (De)
    recipientName: '',   // Campo 'To' (Para)
    recipients: '',      // Campo 'Destinatarios' (Emails)
    subject: 'Envío de Documentos', // Valor por defecto
    body: ''             // Cuerpo del correo
  };

  const [formData, setFormData] = useState(initialFormState);

  // 2. Resetear formulario al abrir
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
    // 3. Validaciones
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

    // 4. Preparar datos para el Padre
    // Convertimos la cadena de correos en un array limpio
    const emailList = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');

    const emailData = {
        senderName: formData.senderName,
        recipientName: formData.recipientName,
        recipients: emailList,
        subject: formData.subject,
        body: formData.body
    };

    console.log("Enviando datos al padre:", emailData);

    // Pasamos los IDs de documentos y el objeto de datos del email
    onSend(selectedDocuments, emailData);
    // Nota: No cerramos el modal aquí, dejamos que el padre lo cierre tras el éxito o error
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
          
          {/* Campo 1: De */}
          <div className="form-group-user">
            <label htmlFor="senderName">
              De <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="senderName"
              name="senderName"
              className="form-input-doc-create" // Estilo consistente
              required
              value={formData.senderName}
              onChange={handleChange}
              placeholder="Nombre del remitente"
            />
          </div>

          {/* Campo 2: Para (Nombre) */}
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

          {/* Campo 3: Destinatarios (Emails) */}
          <div className="form-group-user">
            <label htmlFor="recipients">
              Correos Destinatarios <span className="required-asterisk">*</span>
            </label>
            <small style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.85em' }}>
              Separe los correos con comas (ej: correo1@mail.com, correo2@mail.com)
            </small>
            <input
              type="text"
              id="recipients"
              name="recipients"
              className="form-input-doc-create"
              required
              value={formData.recipients}
              onChange={handleChange}
              placeholder="email@ejemplo.com"
            />
          </div>

          {/* Campo 4: Asunto */}
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

          {/* Campo 5: Cuerpo */}
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

          {/* Resumen de Archivos */}
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
          <button className="modal-button-user save-button-user" onClick={handleSend}>
            Confirmar Envío
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDocumentModal;