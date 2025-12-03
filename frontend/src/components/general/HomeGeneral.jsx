import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import searchIcon from '../../assets/img/Lupa.png';
import folderIcon from '../../assets/img/folder.png'
import editIcon from '../../assets/img/edit.png';
import '../../styles/general/homeGeneral.css';
import { useAuth } from '../../utils/AuthContext';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

// Datos simulados para las carpetas
/*
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
*/

const HomeAdmin = () => {
    const { user } = useAuth();
    console.log(user);
    const [mockFolders, setMockFolders] = useState([])
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFolders = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${apiUrl}/documents/getDocType`);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();
                setMockFolders(data);
            } catch (err) {
                setError(err.message);
                setMessage('Error al cargar las carpetas.');
                console.error('Error al obtener las carpetas:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFolders();
    }, []);
    // Efecto para simular el filtrado de las carpetas
    
    useEffect(() => {
        if(!searchTerm) {
            setFilteredFolders(mockFolders);
            return;
        }

        const results = mockFolders.filter(folder =>
            folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredFolders(results);
    }, [mockFolders, searchTerm]);
   
    // Navegación al hacer clic en carpeta
    const handleFolderClick = (folderId, folderName) => {
        console.log(`Navegando a la carpeta: ${folderName}`);
        const encodedFolderName = encodeURIComponent(folderName);
        navigate(`/${encodedFolderName}`, { state: { folderId: folderId, folderName: folderName } });
    };

    // Función para manejar el clic en el ícono de edición
    const handleEditClick = (e, folderId, folderName) => {
        e.stopPropagation(); 
        
        navigate('/document-type', {
            state: { folderId: folderId, folderName: folderName, isEditing: true }
        });
    };   

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="home-admin-container">
                {/* Título y Bienvenida */}
                <div className="title-section-home">
                    <h2>Gestión de Documentos Gipsy</h2>
                    {user ? (
                        <h3>Bienvenido(a), {user.firstName}</h3>
                    ) : (
                        <h3>Bienvenido(a)</h3>
                    )}
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
                                <div key={folder.id} className="folder-card" onClick={() => handleFolderClick(folder.id, folder.name)}>
                                    <div className="folder-icon-container">
                                        <img src={folderIcon} alt="Carpeta" className="folder-icon" />
                                        <button 
                                            className="edit-documentType" 
                                            onClick={(e) => handleEditClick(e, folder.id, folder.name)} 
                                        >
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