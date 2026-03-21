import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutBaseAdmin from '../base/LayoutBase';
import searchIcon from '../../../assets/img/Lupa.png';
import '../../../styles/general/homeGeneral.css';
import { useAuth } from '../../../utils/AuthContext';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const AvailabilityHome = () => {
    const { user } = useAuth();
    const hasRole = (roleId) => {
        if (!user) return false;
        return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
    };

    
    const [mockFolders, setMockFolders] = useState([])
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const navigate = useNavigate();

    
    useEffect(() => {
        if(!searchTerm) {
            setFilteredFolders();
            return;
        }

        const results = mockFolders.filter(folder =>
            folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredFolders(results);
    }, [mockFolders, searchTerm]);

    return (
        <LayoutBaseAdmin activePage="home">
            <div className="home-admin-container-availability">
                {/* Título y Bienvenida */}
                <div className="title-section-home-availability">
                    <h2>Módulo de Disponibilidad Gipsy</h2>
                    {user ? (
                        <h3>Bienvenido(a), {user.firstName}</h3>
                    ) : (
                        <h3>Bienvenido(a)</h3>
                    )}
                </div>

                {/* Barra de Búsqueda */}
                <div className="search-bar-container-availability">
                    <input
                        type="text"
                        placeholder="Buscar ..."
                        className="search-input-home-availability"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="search-button-home-availability">
                        <img src={searchIcon} alt="Buscar" />
                    </button>
                </div>
            </div>
        </LayoutBaseAdmin>
    );
};

export default AvailabilityHome;