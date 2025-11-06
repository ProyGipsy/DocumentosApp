import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/general/sendDocModal.css';

// Datos simulados para las empresas
const mockCompanies = [
    { id: 1, name: 'Empresa Alpha' },
    { id: 2, name: 'Empresa Beta' },
    { id: 3, name: 'Empresa Delta' },
];

const SendDocumentModal = ({ isOpen, onClose, selectedDocuments, selectedDocumentNames, onSend }) => {
  // Estado para los datos del formulario de envío
  const [formData, setFormData] = useState({
    companyID: '',
    message: '',
  });

  // Resetear el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        companyID: '',
        message: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSend = () => {
    if (!formData.From) {
      alert('Por favor, indique a nombre de quién se envían los documentos.');
      return;
    }
    if (!formData.To) {
        alert('Por favor, indique a nombre de se espera que sean recibidos los documentos.');
        return;
    }
    if (!formData.Recipients) {
        alert('Por favor, indique los destinatarios del envío.');
        return;
    }
    if (!formData.Subject) {
        alert('Por favor, indique el asunto del envío');
        return;
    }

    // Lógica para enviar los documentos
    // Aquí se ejecutaría la llamada API
    console.log("Documentos a enviar:", selectedDocuments);
    console.log("Empresa Destino ID:", formData.companyID);
    console.log("Mensaje:", formData.message);

    onSend(selectedDocuments, formData.companyID, formData.message);
    onClose(); // Cerrar el modal después del envío
  };

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user">
        <div className="modal-header-user">
          <h3>Enviar {selectedDocuments.length} Documento{selectedDocuments.length !== 1 ? 's' : ''}</h3>
          <button className="close-button-user" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body-user">
          {/* Campo 1: De */}
          <div className="form-group-user">
            <label htmlFor="From">
              De <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="From"
              name="From"
              required
              value={formData.From}
              onChange={handleChange}
              placeholder="Ingrese a nombre de quién se envían los documentos"
            />
        </div>

        {/* Campo 2: Para */}
         <div className="form-group-user">
            <label htmlFor="To">
              Para <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="To"
              name="To"
              required
              value={formData.To}
              onChange={handleChange}
              placeholder="Ingrese a nombre de quién se espera que sean recibidos los documentos"
            />
        </div>

        {/* Campo 3: Destinatarios */}
        <div className="form-group-user">
            <label htmlFor="Recipients">
              Destinatarios <span className="required-asterisk">*</span>
            </label>
            <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
              Para ingresar dos o más destinatarios, separe los correos con comas (,)
            </small>
            <input
              type="text"
              id="Recipients"
              name="Recipients"
              required
              value={formData.Recipients}
              onChange={handleChange}
              placeholder="email1@mail.com, email2@mail.com, ..."
            />
        </div>

        {/* Campo 4: Asunto */}
        <div className="form-group-user">
            <label htmlFor="Subject">
              Asunto <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="Subject"
              name="Subject"
              required
              value={formData.Subject}
              onChange={handleChange}
              placeholder="Envío de Documentos"
            />
        </div>

        {/* Campo 5: Cuerpo del correo */}
        <div className="form-group-user">
            <label htmlFor="Body">
              Cuerpo del correo
            </label>
            <textarea
              id="Body"
              name="Body"
              value={formData.Body}
              onChange={handleChange}
              rows="4"
              placeholder="Escriba un mensaje para el destinatario (opcional)"
              className="textarea-modal"
            />
        </div>

    {/* Mostrar los nombres de documentos seleccionados (o IDs si no hay nombres) */}
    <small style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
      Se adjuntan los archivos {(selectedDocumentNames.join(', '))}
    </small>

        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSend}>
            Enviar Documento{selectedDocuments.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDocumentModal;