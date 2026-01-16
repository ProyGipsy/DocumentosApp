import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import editIcon from '../../assets/img/edit.png';
import ContactsModal from './ContactsModal';
import { useAuth } from '../../utils/AuthContext';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 100;

const Contacts = () => {
    const { user } = useAuth();
    const [allContacts, setAllContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    const [contactToEdit, setContactToEdit] = useState(null);

    const loadContacts = async () => {

        if (!user || !user.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/documents/getContacts?userId=${user.id}`);
            
            if (!response.ok) throw new Error('Error al obtener los Contactos');
            
            const data = await response.json();
            setAllContacts(data);

            if (!searchTerm || searchTerm.trim() === '') {
                setFilteredContacts(data);
            }
        } catch (err) {
            console.error('Error al obtener los Contactos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

    useEffect(() => {
        let results = [...allContacts];
        if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.alias.toLowerCase().includes(q) || 
                (c.emails && c.emails.some(email => email.toLowerCase().includes(q)))
            );
        }
        setFilteredContacts(results);
    }, [searchTerm, allContacts]);

    const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE) || 1;

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredContacts, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredContacts.length]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleAddContact = () => {
        setModalMode('add');
        setContactToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditContact = (contactId) => {
        const contact = allContacts.find(c => c.id === contactId);
        if (!contact) return;
        setModalMode('edit');
        setContactToEdit(contact);
        setIsModalOpen(true);
    };

    // Callback cuando el modal guarda exitosamente
    const handleSaveContact = (savedContact, mode) => {
        if (mode === 'add') {
            setAllContacts(prev => [...prev, savedContact]);
        } else {
            setAllContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
        }
        setIsModalOpen(false);
        setContactToEdit(null);
    };

    return (
        <LayoutBase activePage="contacts">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Gestión de Contactos</h2>

                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style send-documents-layout">
                        <input
                            type="text"
                            placeholder="Buscar por Alias o Email..."
                            className="search-input-doc-list-sendDocuments"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddContact}>
                        + Agregar Contacto
                    </button>
                </div>

                <div className="send-action-and-table-container">
                    <div className="documents-table-wrapper">
                        {isLoading ? (
                            <p style={{textAlign:'center', padding:'20px'}}>Cargando...</p>
                        ) : paginated.length > 0 ? (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th style={{width: '30%'}}>ALIAS</th>
                                        <th style={{width: '60%'}}>CORREOS ELECTRÓNICOS</th>
                                        <th style={{width: '10%'}}>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(contact => (
                                        <tr key={contact.id}>
                                            <td style={{fontWeight: 'bold', color:'#421d83'}}>{contact.alias}</td>
                                            <td>
                                                {/* Renderizamos los correos como etiquetas visuales también en la tabla */}
                                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                                                    {contact.emails && contact.emails.length > 0
                                                        ? contact.emails.map((email, idx) => (
                                                            <span key={idx} style={{
                                                                background: '#f0f2f5', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '10px', 
                                                                fontSize: '0.85em',
                                                                border: '1px solid #e1e4e8'
                                                            }}>
                                                                {email}
                                                            </span>
                                                        ))
                                                        : <span style={{color:'#999'}}>Sin correos</span>}
                                                </div>
                                            </td>
                                            <td className="actions-cell">
                                                <button 
                                                    className="view-button" 
                                                    onClick={() => handleEditContact(contact.id)}
                                                    title="Editar"
                                                >
                                                    <img src={editIcon} alt="Editar" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-documents">
                                <p>No se encontraron contactos registrados.</p>
                            </div>
                        )}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">
                            Anterior
                        </button>
                        <span style={{margin: '0 10px'}}>Página {currentPage} de {totalPages}</span>
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            <ContactsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                contact={contactToEdit}
                onSave={handleSaveContact}
                userId={user.id}
            />
        </LayoutBase>
    );
}

export default Contacts;