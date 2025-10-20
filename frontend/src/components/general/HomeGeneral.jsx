import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import searchIcon from '../../assets/IMG/Lupa.png';
import folderIcon from '../../assets/IMG/folder.png'
import editIcon from '../../assets/IMG/edit.png';
import '../../styles/general/homeGeneral.css';

// Datos simulados para las carpetas
const mockFolders = [
    { id: 1, name: 'Contrato de Arrendamiento' },
    { id: 2, name: 'RIF' },
    { id: 3, name: 'Vehículos' },
    { id: 4, name: 'Poderes' },
    { id: 5, name: 'Permiso Sanitario Locales' },
    { id: 6, name: 'Registros Mercantiles' },
    { id: 7, name: 'Patente' },
    { id: 8, name: 'Corpoelec' },
    { id: 9, name: 'Registro Sanitario' },
    { id: 10, name: 'Pólizas Seguro' },
    { id: 11, name: 'Dominios' },
];

const HomeAdmin = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredFolders, setFilteredFolders] = useState(mockFolders);
    const navigate = useNavigate();

    // Efecto para simular el filtrado de las carpetas
    useEffect(() => {
        const results = mockFolders.filter(folder =>
            folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFolders(results);
    }, [searchTerm]);

    // Navegación al hacer clic en carpeta
    const handleFolderClick = (folderName) => {
        console.log(`Navegando a la carpeta: ${folderName}`);
        const encodedFolderName = encodeURIComponent(folderName);
        navigate(`/${encodedFolderName}`);
    };

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="home-admin-container">
                {/* Título y Bienvenida */}
                <div className="title-section-home">
                    <h2>Gestión de Documentos Gipsy</h2>
                    <h3>Bienvenido(a), Usuario</h3>
                </div>

                {/* Barra de Búsqueda */}
                <div className="search-bar-container">
                    <input
                        type="text"
                        placeholder="Buscar ..."
                        className="search-input-home"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="search-button-home">
                        <img src={searchIcon} alt="Buscar" />
                    </button>
                </div>

                {/* Cuadrícula de Carpetas */}
                <div className="folders-grid-container">
                    {filteredFolders.length > 0 ? (
                        <div className="folders-grid">
                            {filteredFolders.map((folder) => (
                                <div key={folder.id} className="folder-card" onClick={() => handleFolderClick(folder.name)}>
                                    <div className="folder-icon-container">
                                        <img src={folderIcon} alt="Carpeta" className="folder-icon" />
                                        <button className="edit-documentType" onClick={(e) => {
                                            e.stopPropagation(); // Evita que se active el handleFolderClick del padre
                                            console.log(`Acceso directo a: ${folder.name}`);
                                            // Lógica para abrir el enlace externo si es necesario
                                        }}>
                                            <img src={editIcon} alt="Editar" />
                                        </button>
                                    </div>
                                    <p className="folder-name">{folder.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-results-home">No se encontraron carpetas.</p>
                    )}
                </div>
            </div>
        </LayoutBaseAdmin>
    );
};

export default HomeAdmin;