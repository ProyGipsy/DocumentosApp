import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/SendDocuments.css'; 
import editIcon from '../../assets/img/edit.png';

// Datos simulados de empresas
const mockCompanies = [
    { id: 1, name: 'Gipsy S.A.', rif: 'J-12345678-9' },
    { id: 2, name: 'Empresa Beta', rif: 'J-98765432-1' },
    { id: 3, name: 'Empresa Delta', rif: 'J-11223344-5' },
    { id: 4, name: 'Empresa Alpha', rif: 'J-55667788-0' },
    { id: 5, name: 'Comercial XYZ', rif: 'J-22334455-6' },
    { id: 6, name: 'Servicios ABC', rif: 'J-33445566-7' },
    { id: 7, name: 'Industrias LMN', rif: 'J-44556677-8' },
    { id: 8, name: 'Distribuciones QRS', rif: 'J-55667788-9' },
    { id: 9, name: 'Logística TUV', rif: 'J-66778899-0' },
    { id: 10, name: 'Soluciones 123', rif: 'J-77889900-1' },
    { id: 11, name: 'Compañía Nuevo', rif: 'J-88990011-2' },
];

const ITEMS_PER_PAGE = 100;

const Companies = () => {
    const [allCompanies] = useState(mockCompanies);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredCompanies, setFilteredCompanies] = useState(allCompanies);

    useEffect(() => {
        let results = [...allCompanies];
        if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(q) || c.rif.toLowerCase().includes(q)
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
        alert('Abrir modal para crear compañía.');
    };

    const handleEditCompany = () => {
        alert('Abrir modal para crear compañía, pero con datos existentes.');
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
                            placeholder="Buscar por nombre o RIF..."
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
                                            <td>{company.rif}</td>
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
        </LayoutBase>
    );
};

export default Companies;