import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';
import { useAuth } from '../../utils/AuthContext';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const SendDocumentModal = ({ isOpen, onClose, selectedDocuments, selectedDocumentNames, onSend, isLoading=true }) => {
  
  const initialFormState = {
    senderName: '',      
    recipientName: '',   
    recipients: [], 
    subject: 'Envío de Documentos', 
    body: '',
    // --- CAMPOS NUEVO CONTACTO ---
    saveNewContact: false,
    newContactAlias: '',
    newContactEmails: [] 
  };

  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  
  const [contactSearchInput, setContactSearchInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [newContactEmailInput, setNewContactEmailInput] = useState('');

  // Estados de datos
  const [availableEmails, setAvailableEmails] = useState([]); 
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false); 
  
  const [userContacts, setUserContacts] = useState([]); 
  const [selectedContacts, setSelectedContacts] = useState([]); 
  const [aliasSuggestions, setAliasSuggestions] = useState([]);
  const [showAliasSuggestions, setShowAliasSuggestions] = useState(false);

  // Estados para sugerencias del NUEVO contacto
  const [newContactSuggestions, setNewContactSuggestions] = useState([]);
  const [showNewContactSuggestions, setShowNewContactSuggestions] = useState(false);

  // 1. CARGA INICIAL
  useEffect(() => {
    if (isOpen && user?.id) {
      setFormData(initialFormState);
      setSelectedContacts([]);
      setEmailInput('');
      setContactSearchInput('');
      setNewContactEmailInput('');
      
      const loadData = async () => {
        try {
            const emailRes = await fetch(`${apiUrl}/documents/getSuggestedEmails?userId=${user.id}`);
            if (emailRes.ok) setAvailableEmails(await emailRes.json());

            const contactsRes = await fetch(`${apiUrl}/documents/getContacts?userId=${user.id}`);
            if (contactsRes.ok) setUserContacts(await contactsRes.json());
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
      };
      loadData();
    }
  }, [isOpen, user]);

  // 2. FILTROS (Email Principal)
  useEffect(() => {
    const currentTerm = emailInput.trim();
    if (currentTerm.length > 0) {
        const matches = availableEmails.filter(email => 
            email.toLowerCase().includes(currentTerm.toLowerCase()) &&
            !formData.recipients.includes(email)
        );
        setFilteredSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    } else {
        setShowSuggestions(false);
    }
  }, [emailInput, availableEmails, formData.recipients]);

  // 3. FILTROS (Contactos)
  useEffect(() => {
    const text = contactSearchInput.trim();
    if (text.length > 0) {
        const matches = userContacts.filter(contact => 
            contact.alias.toLowerCase().includes(text.toLowerCase()) &&
            !selectedContacts.some(sc => sc.id === contact.id)
        );
        setAliasSuggestions(matches);
        setShowAliasSuggestions(matches.length > 0);
    } else {
        setShowAliasSuggestions(false);
    }
  }, [contactSearchInput, userContacts, selectedContacts]);

  // 4. FILTROS (NUEVO CONTACTO)
  useEffect(() => {
    const term = newContactEmailInput.trim().toLowerCase();
    
    // Solo actualizamos la lista si el usuario está escribiendo o el input tiene el foco activo
    if (formData.recipients.length > 0) {
        const matches = formData.recipients.filter(email => 
            email.toLowerCase().includes(term) && 
            !formData.newContactEmails.includes(email)
        );
        
        // Verificamos document.activeElement para asegurarnos que solo se muestra si el usuario está ahí
        if (matches.length > 0 && (term.length > 0 || document.activeElement?.id === 'newContactEmailInput')) {
            setNewContactSuggestions(matches);
            setShowNewContactSuggestions(true);
        } else {
            // Si no hay match, ocultamos
             // Nota: No forzamos el false aquí drásticamente para no parpadear, 
             // dejamos que el onBlur se encargue de cerrar si se pierde el foco.
            if (term.length === 0 && document.activeElement?.id !== 'newContactEmailInput') {
                 setShowNewContactSuggestions(false);
            }
        }
    }
  }, [newContactEmailInput, formData.recipients, formData.newContactEmails]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  // ... (Funciones de chips principales sin cambios) ...
  const addEmailsToChips = (emailsToAdd) => {
      const list = Array.isArray(emailsToAdd) ? emailsToAdd : [emailsToAdd];
      const cleanList = list.map(e => e.trim()).filter(e => e !== '' && !formData.recipients.includes(e));
      if (cleanList.length > 0) {
          setFormData(prev => ({ ...prev, recipients: [...prev.recipients, ...cleanList] }));
      }
  };

  const handleEmailKeyDown = (e) => {
      if (['Enter', ',', 'Tab'].includes(e.key)) {
          e.preventDefault();
          const val = emailInput.trim();
          if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              addEmailsToChips(val);
              setEmailInput('');
          }
      } else if (e.key === 'Backspace' && emailInput === '' && formData.recipients.length > 0) {
          const newRecipients = [...formData.recipients];
          newRecipients.pop();
          setFormData(prev => ({ ...prev, recipients: newRecipients }));
      }
  };

  const handleRemoveEmailChip = (emailToRemove) => {
      setFormData(prev => ({
          ...prev,
          recipients: prev.recipients.filter(e => e !== emailToRemove)
      }));
  };

  const handleSelectEmailSuggestion = (email) => {
    addEmailsToChips(email);
    setEmailInput('');
    setShowSuggestions(false);
    document.getElementById('emailInput').focus();
  };

  // ... (Funciones de chips nuevo contacto sin cambios) ...
  const addNewContactEmailsToChips = (emailsToAdd) => {
      const list = Array.isArray(emailsToAdd) ? emailsToAdd : [emailsToAdd];
      const cleanList = list.map(e => e.trim()).filter(e => e !== '' && !formData.newContactEmails.includes(e));
      if (cleanList.length > 0) {
          setFormData(prev => ({ ...prev, newContactEmails: [...prev.newContactEmails, ...cleanList] }));
      }
  };

  const handleNewContactEmailKeyDown = (e) => {
      if (['Enter', ',', 'Tab'].includes(e.key)) {
          e.preventDefault();
          const val = newContactEmailInput.trim();
          if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              addNewContactEmailsToChips(val);
              setNewContactEmailInput('');
          }
      } else if (e.key === 'Backspace' && newContactEmailInput === '' && formData.newContactEmails.length > 0) {
          const newEmails = [...formData.newContactEmails];
          newEmails.pop();
          setFormData(prev => ({ ...prev, newContactEmails: newEmails }));
      }
  };

  const handleRemoveNewContactEmailChip = (emailToRemove) => {
      setFormData(prev => ({
          ...prev,
          newContactEmails: prev.newContactEmails.filter(e => e !== emailToRemove)
      }));
  };

  const handleSelectNewContactSuggestion = (email) => {
      addNewContactEmailsToChips(email);
      setNewContactEmailInput('');
      setShowNewContactSuggestions(false);
      document.getElementById('newContactEmailInput').focus();
  };

  // ... (Funciones de Contactos existentes) ...
  const handleSelectContact = (contact) => {
      setSelectedContacts(prev => [...prev, contact]);
      addEmailsToChips(contact.emails);
      setContactSearchInput('');
      setShowAliasSuggestions(false);
      if (formData.recipientName === '') {
          setFormData(prev => ({ ...prev, recipientName: contact.alias }));
      }
  };

  const handleRemoveContact = (contactId) => {
      const contactToRemove = selectedContacts.find(c => c.id === contactId);
      if (!contactToRemove) return;
      setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
      const emailsToRemove = contactToRemove.emails;
      setFormData(prev => ({
          ...prev,
          recipients: prev.recipients.filter(email => !emailsToRemove.includes(email))
      }));
  };

  const handleSend = () => {
    let finalRecipientName = formData.recipientName.trim();
    if (!finalRecipientName && selectedContacts.length > 0) {
        finalRecipientName = selectedContacts.map(c => c.alias).join(', ');
    }

    if (!formData.senderName.trim()) return alert('Indique el remitente.');
    if (!finalRecipientName) return alert('Indique un nombre para el saludo.');
    
    let finalEmailList = [...formData.recipients];
    if (emailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
        finalEmailList.push(emailInput.trim());
    }

    if (finalEmailList.length === 0) return alert('Indique al menos un correo electrónico.');
    if (!formData.subject.trim()) return alert('Indique el asunto.');

    let newContactData = null;
    if (formData.saveNewContact) {
        if (!formData.newContactAlias.trim()) return alert('Debe indicar un Alias para el nuevo contacto.');
        
        let finalNewContactEmails = [...formData.newContactEmails];
        if (newContactEmailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactEmailInput.trim())) {
            finalNewContactEmails.push(newContactEmailInput.trim());
        }

        if (finalNewContactEmails.length === 0) return alert('Debe indicar los correos para el nuevo contacto.');

        newContactData = {
            alias: formData.newContactAlias,
            emails: finalNewContactEmails
        };
    }

    const emailData = {
        senderName: formData.senderName,
        recipientName: finalRecipientName,
        recipients: finalEmailList, 
        subject: formData.subject,
        body: formData.body,
        newContact: newContactData
    };

    onSend(selectedDocuments, emailData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user" onClick={e => e.stopPropagation()}>
        <div className="modal-header-user">
          <h3>Enviar {selectedDocuments.length} Documento{selectedDocuments.length !== 1 ? 's' : ''}</h3>
          <button className="close-button-user" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body-user">
          
          <div className="form-group-user">
            <label htmlFor="senderName">De <span className="required-asterisk">*</span></label>
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
            <label htmlFor="recipientName">Para (Nombre) <span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              className="form-input-doc-create"
              required
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Ej: Clientes Varios"
            />
          </div>

          {/* BUSCADOR DE CONTACTOS */}
          <div className="form-group-user" style={{ position: 'relative' }}>
            <label>Buscar Contactos</label>
            
            {selectedContacts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {selectedContacts.map(contact => (
                        <div key={contact.id} className="chip-item">
                            {contact.alias}
                            <span 
                                className="chip-remove-icon"
                                onClick={() => handleRemoveContact(contact.id)}
                                title="Quitar contacto"
                            >
                                &times;
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <input
              type="text"
              className="form-input-doc-create"
              value={contactSearchInput}
              onChange={(e) => setContactSearchInput(e.target.value)}
              placeholder="Escriba para buscar contactos..."
              autoComplete="off"
              onBlur={() => setTimeout(() => setShowAliasSuggestions(false), 200)}
              onFocus={() => {
                   if(contactSearchInput.length > 0 && aliasSuggestions.length > 0) setShowAliasSuggestions(true);
              }}
            />
            
            {showAliasSuggestions && (
                <ul className="suggestions-list">
                    {aliasSuggestions.map((contact) => (
                        <li 
                            key={contact.id} 
                            onClick={() => handleSelectContact(contact)}
                            className="suggestion-item"
                        >
                            <strong>{contact.alias}</strong> 
                            <span className="suggestion-detail">
                                ({contact.emails.length} correos)
                            </span>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* CORREOS DESTINATARIOS */}
          <div className="form-group-user" style={{ position: 'relative' }}>
            <label htmlFor="recipients">Correos Destinatarios <span className="required-asterisk">*</span></label>
            <small style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.85em' }}>
              Escriba y presione Enter o Coma.
            </small>
            
            <div 
                className="chips-input-container" 
                onClick={() => document.getElementById('emailInput').focus()}
            >
                {formData.recipients.map((email, idx) => (
                    <div key={idx} className="chip-item">
                        {email}
                        <span 
                            className="chip-remove-icon"
                            onClick={(e) => { e.stopPropagation(); handleRemoveEmailChip(email); }}
                        >
                            &times;
                        </span>
                    </div>
                ))}

                <input
                    type="text"
                    id="emailInput"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    placeholder={formData.recipients.length === 0 ? "ejemplo@correo.com" : ""}
                    autoComplete="off"
                    className="chips-input-internal"
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
            </div>
            
            {showSuggestions && (
                <ul className="suggestions-list">
                    {filteredSuggestions.map((email, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleSelectEmailSuggestion(email)}
                            className="suggestion-item"
                        >
                            {email}
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* SECCIÓN GUARDAR NUEVO CONTACTO */}
          <div className="form-group-user send-checkbox-group" style={{marginTop: '20px'}}>
            <label htmlFor="saveNewContact" className="send-checkbox-label">
                <input
                    type="checkbox"
                    id="saveNewContact"
                    name="saveNewContact"
                    checked={formData.saveNewContact}
                    onChange={handleChange}
                />
                <span className="custom-checkmark"></span>
                ¿Desea guardar un nuevo contacto?
            </label>
          </div>

          {formData.saveNewContact && (
            <div style={{ 
                paddingLeft: '15px', marginLeft: '5px', borderLeft: '3px solid #8b56ed', 
                marginBottom: '15px', backgroundColor: '#fbfaff', padding: '10px 15px', borderRadius: '0 6px 6px 0'
            }}>
                <div className="form-group-user">
                    <label>Alias del Nuevo Contacto <span className="required-asterisk">*</span></label>
                    <input
                        type="text"
                        name="newContactAlias"
                        className="form-input-doc-create"
                        value={formData.newContactAlias}
                        onChange={handleChange}
                        placeholder="Ej: Proveedor Papelería"
                    />
                </div>
                
                <div className="form-group-user" style={{ marginBottom: 0, position: 'relative' }}>
                    <label>Correos Asociados <span className="required-asterisk">*</span></label>
                    <small style={{display:'block', color:'#666', marginBottom:'5px', fontSize:'0.85em'}}>
                        Agregue correos. (Sugeridos de arriba: haga clic en el campo)
                    </small>
                    
                    <div 
                        className="chips-input-container" 
                        onClick={() => {
                            const input = document.getElementById('newContactEmailInput');
                            input.focus();
                            if (!newContactEmailInput && formData.recipients.length > 0) {
                                setNewContactSuggestions(formData.recipients.filter(e => !formData.newContactEmails.includes(e)));
                                setShowNewContactSuggestions(true);
                            }
                        }}
                    >
                        {formData.newContactEmails.map((email, idx) => (
                            <div key={idx} className="chip-item">
                                {email}
                                <span 
                                    className="chip-remove-icon"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveNewContactEmailChip(email); }}
                                >
                                    &times;
                                </span>
                            </div>
                        ))}

                        <input
                            type="text"
                            id="newContactEmailInput"
                            value={newContactEmailInput}
                            onChange={(e) => setNewContactEmailInput(e.target.value)}
                            onKeyDown={handleNewContactEmailKeyDown}
                            placeholder={formData.newContactEmails.length === 0 ? "nuevo@correo.com" : ""}
                            autoComplete="off"
                            className="chips-input-internal"
                            
                            onFocus={() => {
                                if (formData.recipients.length > 0) {
                                    setNewContactSuggestions(formData.recipients.filter(e => !formData.newContactEmails.includes(e)));
                                    setShowNewContactSuggestions(true);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowNewContactSuggestions(false);
                                }, 200);
                            }}
                        />
                    </div>

                    {showNewContactSuggestions && (
                        <ul className="suggestions-list">
                            {newContactSuggestions.length > 0 ? (
                                newContactSuggestions.map((email, index) => (
                                    <li 
                                        key={index} 
                                        onClick={() => handleSelectNewContactSuggestion(email)}
                                        className="suggestion-item"
                                    >
                                        {email} <span style={{fontSize: '0.8em', color: '#8b56ed', float: 'right'}}>(Del envío)</span>
                                    </li>
                                ))
                            ) : (
                                <li className="suggestion-item" style={{cursor: 'default', color: '#999', fontSize:'0.85em'}}>
                                    No hay sugerencias disponibles
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
          )}

          <br />
          <div className="form-group-user">
            <label htmlFor="subject">Asunto <span className="required-asterisk">*</span></label>
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

        {/* SECCIÓN GUARDAR NUEVO CONTACTO AL FINAL POR SI ACASO*/}
        {/*
          <div className="form-group-user send-checkbox-group" style={{marginTop: '20px'}}>
            <label htmlFor="saveNewContact" className="send-checkbox-label">
                <input
                    type="checkbox"
                    id="saveNewContact"
                    name="saveNewContact"
                    checked={formData.saveNewContact}
                    onChange={handleChange}
                />
                <span className="custom-checkmark"></span>
                ¿Desea guardar un nuevo contacto?
            </label>
          </div>

          {formData.saveNewContact && (
            <div style={{ 
                paddingLeft: '15px', marginLeft: '5px', borderLeft: '3px solid #8b56ed', 
                marginBottom: '15px', backgroundColor: '#fbfaff', padding: '10px 15px', borderRadius: '0 6px 6px 0'
            }}>
                <div className="form-group-user">
                    <label>Alias del Nuevo Contacto <span className="required-asterisk">*</span></label>
                    <input
                        type="text"
                        name="newContactAlias"
                        className="form-input-doc-create"
                        value={formData.newContactAlias}
                        onChange={handleChange}
                        placeholder="Ej: Proveedor Papelería"
                    />
                </div>
                
                <div className="form-group-user" style={{ marginBottom: 0, position: 'relative' }}>
                    <label>Correos Asociados <span className="required-asterisk">*</span></label>
                    <small style={{display:'block', color:'#666', marginBottom:'5px', fontSize:'0.85em'}}>
                        Agregue correos. (Sugeridos de arriba: haga clic en el campo)
                    </small>
                    
                    <div 
                        className="chips-input-container" 
                        onClick={() => {
                            const input = document.getElementById('newContactEmailInput');
                            input.focus();
                            // Forzamos sugerencias al hacer click en el contenedor (simula focus)
                            if (!newContactEmailInput && formData.recipients.length > 0) {
                                setNewContactSuggestions(formData.recipients.filter(e => !formData.newContactEmails.includes(e)));
                                setShowNewContactSuggestions(true);
                            }
                        }}
                    >
                        {formData.newContactEmails.map((email, idx) => (
                            <div key={idx} className="chip-item">
                                {email}
                                <span 
                                    className="chip-remove-icon"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveNewContactEmailChip(email); }}
                                >
                                    &times;
                                </span>
                            </div>
                        ))}

                        <input
                            type="text"
                            id="newContactEmailInput"
                            value={newContactEmailInput}
                            onChange={(e) => setNewContactEmailInput(e.target.value)}
                            onKeyDown={handleNewContactEmailKeyDown}
                            placeholder={formData.newContactEmails.length === 0 ? "nuevo@correo.com" : ""}
                            autoComplete="off"
                            className="chips-input-internal"
                            
                            onFocus={() => {
                                if (formData.recipients.length > 0) {
                                    setNewContactSuggestions(formData.recipients.filter(e => !formData.newContactEmails.includes(e)));
                                    setShowNewContactSuggestions(true);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowNewContactSuggestions(false);
                                }, 200);
                            }}
                        />
                    </div>

                    {showNewContactSuggestions && (
                        <ul className="suggestions-list">
                            {newContactSuggestions.length > 0 ? (
                                newContactSuggestions.map((email, index) => (
                                    <li 
                                        key={index} 
                                        onClick={() => handleSelectNewContactSuggestion(email)}
                                        className="suggestion-item"
                                    >
                                        {email} <span style={{fontSize: '0.8em', color: '#8b56ed', float: 'right'}}>(Del envío)</span>
                                    </li>
                                ))
                            ) : (
                                <li className="suggestion-item" style={{cursor: 'default', color: '#999', fontSize:'0.85em'}}>
                                    No hay sugerencias disponibles
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
          )}
        */}

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