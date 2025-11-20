import React, { useState, useMemo, useEffect } from 'react';
import LayoutBase from '../base/LayoutBase';
import '../../styles/general/sendDocuments.css'; 
import editIcon from '../../assets/img/edit.png';
import RolesModal from './RolesModal';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// Datos simulados de roles
/*
const mockRoles = [
    { 
        id: 1,
        name: 'Administrador',
        permisos: [
            'PermisoAdministrador', 
            'Gráficos Flujo de Caja', 
            'Reportes de Ventas', 
            'Reportes Flujo de Caja' 
        ],
        usuarios: [
            'Login1965',
        ]
    },
    { 
        id: 2, 
        name: 'Vendedor', 
        permisos: [
            'PermisoVendedor',
            'Reportes de Ventas'
        ],
        usuarios: [
            'fhenao'
        ]
    },
    { 
        id: 3, 
        name: 'Supervisor', 
        permisos: [
            'PermisoAdministrador', 
            'Reportes Saldos de Cuentas',
            'Reportes Comisiones de Vendedores'
        ],
        usuarios: [
            'armandoc',
            'josem'
        ]
    },
    { 
        id: 4, 
        name: 'Sistemas', 
        permisos: [
            'PermisoAdministrador',
            'Reportes Flujo de Caja', 
            'Reportes Resumen IVA',
            'Reportes de Ventas',
            'Reportes de Garantías',
        ],
        usuarios: [
            'tinadivasta',
            'jars',
            'yarima',
            'danielhdez'
        ]
    },
    { 
        id: 5, 
        name: 'Almacén', 
        permisos: [
            'PermisoVendedor', 
            'Gráficos Flujo de Caja'
        ],
    },
];
*/

const ITEMS_PER_PAGE = 100;

const Roles = () => {
    const [allRoles, setAllRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredRoles, setFilteredRoles] = useState(allRoles);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [roleToEdit, setRoleToEdit] = useState(null);

    useEffect(() => {
        const fetchAllRoles = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${apiUrl}/documents/getRoles`);

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
                setAllRoles(data);
            } catch (err) {
                console.error('Error al obtener los roles:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllRoles();
    }, []);

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
        setModalMode('add');
        setRoleToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditRole = (roleId) => {
        const role = allRoles.find(r => r.id === roleId);
        if (!role) return;
        setModalMode('edit');
        setRoleToEdit(role);
        setIsModalOpen(true);
    };

    const handleSaveRole = (roleObj, mode) => {
        if (mode === 'add') {
            setAllRoles(prev => [roleObj, ...prev]);
        } else if (mode === 'edit') {
            setAllRoles(prev => prev.map(c => c.id === roleObj.id ? roleObj : c));
        }
        // actualizar también filteredRoles inmediatamente
        setFilteredRoles(prev => {
            const exists = prev.some(c => c.id === roleObj.id);
            if (mode === 'add') return [roleObj, ...prev];
            return prev.map(c => c.id === roleObj.id ? roleObj : c);
        });
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
                                        <th>USUARIOS</th>
                                        <th>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(role => (
                                        <tr key={role.id}>
                                            <td>{role.name}</td>
                                            <td>{role.permisos ? role.permisos.join(' - ') : 'Ninguno'}</td>
                                            {/*<td>{role.usuarios ? role.usuarios.length : 0}</td>*/}
                                            <td>{role.usuarios ? role.usuarios.join(', ') : 'Ninguno'}</td>
                                            <td className="actions-cell">
                                                <button 
                                                    className="view-button" 
                                                    onClick={() => handleEditRole(role.id)}
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
            <RolesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                role={roleToEdit}
                onSave={handleSaveRole}
            />
        </LayoutBase>
    );
};

export default Roles;