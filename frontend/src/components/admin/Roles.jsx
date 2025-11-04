import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import editIcon from '../../assets/img/edit.png';

// Datos simulados de roles
const mockRoles = [
    { id: 1, name: 'Administrador', rif: 'J-12345678-9' },
    { id: 2, name: 'Editor', rif: 'J-98765432-1' },
    { id: 3, name: 'Visualizador', rif: 'J-11223344-5' },
    { id: 4, name: 'Invitado', rif: 'J-55667788-0' },
];

const ITEMS_PER_PAGE = 100;

const Roles = () => {
    const [allRoles] = useState(mockRoles);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredRoles, setFilteredRoles] = useState(allRoles);

    useEffect(() => {
        let results = [...allRoles];
        if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(q) || c.rif.toLowerCase().includes(q)
            );
        }
        setFilteredRoles(results);
    }, [searchTerm, allRoles]);

    const totalPages = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE) || 1;

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRoles.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredRoles, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filteredRoles.length]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleAddRole = () => {
        alert('Abrir modal para crear un rol.');
    };

    const handleEditRole = () => {
        alert('Abrir modal para editar un rol.');
    };

    return (
        <LayoutBase activePage="roles">
            <div className="sendDocument-list-container">
                <h2 className="folder-title-sendDocuments">Roles</h2>

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

                {/* Botón de Agregar Rol */}
                <div className="add-doc-button-container">
                    <button className="add-doc-button" onClick={handleAddRole}>
                        + Agregar Rol
                    </button>
                </div>

                <div className="send-action-and-table-container">
                    <div className="documents-table-wrapper">
                        {paginated.length > 0 ? (
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th>ROL</th>
                                        <th>PERMISOS</th>
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
                                                    onClick={() => handleEditRole(company.id)}
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
                            <p className="no-documents">No se encontraron roles.</p>
                        )}
                    </div>
                </div>

                {/* Paginación */}
                {filteredRoles.length > ITEMS_PER_PAGE && (
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

export default Roles;