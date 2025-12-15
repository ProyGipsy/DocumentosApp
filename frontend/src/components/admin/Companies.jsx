import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import editIcon from '../../assets/img/edit.png';
import CompaniesModal from './CompaniesModal';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const ITEMS_PER_PAGE = 100;

const Companies = () => {
    const [allCompanies, setAllCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [companyToEdit, setCompanyToEdit] = useState(null);

    // --- 1. FUNCIÓN REUTILIZABLE PARA CARGAR DATOS ---
    const loadCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/documents/getDocCompanies`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Entidades cargadas:", data);
            
            setAllCompanies(data);
            
            // Si no hay búsqueda activa, actualizamos la vista inmediatamente
            // (Si hay búsqueda, el useEffect de abajo se encargará de filtrar la nueva lista)
            if (!searchTerm) {
                setFilteredCompanies(data);
            }
            
        } catch (err) {
            console.error('Error al obtener las Entidades:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. EFECTO DE CARGA INICIAL ---
    useEffect(() => {
        loadCompanies();
    }, []);

    // --- 3. LÓGICA DE FILTRADO ---
    useEffect(() => {
        let results = [...allCompanies];
        if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(q) || 
                (c.rifNumber && c.rifNumber.toString().includes(q))
            );
        }
        setFilteredCompanies(results);
    }, [searchTerm, allCompanies]);

    // --- 4. PAGINACIÓN ---
    const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE) || 1;

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCompanies, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredCompanies.length]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // --- 5. MANEJADORES DE ACCIÓN ---

    const handleAddCompany = () => {
        setModalMode('add');
        setCompanyToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditCompany = (companyId) => {
        const comp = allCompanies.find(c => c.id === companyId);
        if (!comp) return;
        setModalMode('edit');
        setCompanyToEdit(comp);
        setIsModalOpen(true);
    };

    // --- 6. MANEJADOR DE GUARDADO (POST-MODAL) ---
    const handleSaveCompany = async () => {
        // Cerramos el modal
        setIsModalOpen(false);
        setCompanyToEdit(null);
        
        // Recargamos los datos del servidor para ver los cambios
        await loadCompanies();
        
        // Opcional: Mostrar alerta de éxito
        // alert("Lista de Entidades actualizada.");
    };

    return (
        <LayoutBase activePage="companies">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Entidades</h2>

                {/* Barra de búsqueda */}
                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style send-documents-layout">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RIF..."
                            className="search-input-doc-list-sendDocuments"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Botón de Agregar Entidad */}
                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddCompany}>
                        + Agregar Entidad
                    </button>
                </div>

                <div className="send-action-and-table-container">
                    <div className="documents-table-wrapper">
                        {isLoading && paginated.length === 0 ? (
                            <p style={{textAlign:'center', padding:'20px'}}>Cargando Entidades...</p>
                        ) : paginated.length > 0 ? (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th>Nombre Entidad</th>
                                        <th>RIF</th>
                                        <th>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(company => (
                                        <tr key={company.id}>
                                            <td>{company.name}</td>
                                            {/* Manejo seguro si rifType o rifNumber vienen nulos */}
                                            <td>
                                                {company.rifType && company.rifNumber 
                                                    ? `${company.rifType}-${company.rifNumber}` 
                                                    : 'N/A'}
                                            </td>
                                            <td className="actions-cell">
                                                <button 
                                                    className="view-button" 
                                                    onClick={() => handleEditCompany(company.id)}
                                                    title="Editar Entidad"
                                                >
                                                    <img src={editIcon} alt="Editar" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-documents">No se encontraron Entidades.</p>
                        )}
                    </div>
                </div>

                {/* Controles de Paginación (Solo si hay más de 1 página) */}
                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <button 
                            onClick={() => goToPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Anterior
                        </button>
                        <span style={{margin: '0 10px'}}>Página {currentPage} de {totalPages}</span>
                        <button 
                            onClick={() => goToPage(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <CompaniesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                company={companyToEdit}
                onSave={handleSaveCompany}
            />
        </LayoutBase>
    );
};

export default Companies;