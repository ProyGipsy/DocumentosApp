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
    const [filteredCompanies, setFilteredCompanies] = useState(allCompanies);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [companyToEdit, setCompanyToEdit] = useState(null);

    useEffect(() => {
        const fetchAllCompanies = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${apiUrl}/documents/getDocCompanies`);

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
                setAllCompanies(data);
            } catch (err) {
                console.error('Error al obtener las empresas:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllCompanies();
    }, []);

    useEffect(() => {
        let results = [...allCompanies];
        if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(q) /*|| c.rifNumber.toLowerCase().includes(q)*/
            );
        }
        setFilteredCompanies(results);
    }, [searchTerm, allCompanies]);

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

    const handleSaveCompany = (companyObj, mode) => {
        if (mode === 'add') {
            setAllCompanies(prev => [companyObj, ...prev]);
        } else if (mode === 'edit') {
            setAllCompanies(prev => prev.map(c => c.id === companyObj.id ? companyObj : c));
        }
        // actualizar también filteredCompanies inmediatamente
        setFilteredCompanies(prev => {
            const exists = prev.some(c => c.id === companyObj.id);
            if (mode === 'add') return [companyObj, ...prev];
            return prev.map(c => c.id === companyObj.id ? companyObj : c);
        });
    };

    return (
        <LayoutBase activePage="companies">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Empresas</h2>

                {/* Barra de búsqueda */}
                <div className="search-and-controls">
                    <div className="search-filter-group users-table-style send-documents-layout">
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="search-input-doc-list-sendDocuments"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Botón de Agregar Empresa */}
                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddCompany}>
                        + Agregar Empresa
                    </button>
                </div>

                <div className="send-action-and-table-container">
                    <div className="documents-table-wrapper">
                        {paginated.length > 0 ? (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th>NOMBRE EMPRESA</th>
                                        <th>RIF</th>
                                        <th>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                            {paginated.map(company => (
                                                <tr key={company.id}>
                                                    <td>{company.name}</td>
                                                    <td>{`${company.rifType} - ${company.rifNumber}`}</td>
                                                    <td className="actions-cell">
                                                        <button 
                                                            className="view-button" 
                                                            onClick={() => handleEditCompany(company.id)}
                                                            title="Editar Empresa"
                                                        >
                                                            <img src={editIcon} alt="Editar" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-documents">No se encontraron empresas.</p>
                        )}
                    </div>
                </div>

                {/* Paginación */}
                {filteredCompanies.length > ITEMS_PER_PAGE && (
                    <div className="pagination-controls">
                        <button 
                            onClick={() => goToPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Anterior
                        </button>
                        <div className="page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`page-number-button ${currentPage === page ? 'active' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
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