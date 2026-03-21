import React from 'react';
import { useAuth } from '../../../utils/AuthContext';
import { Link } from 'react-router-dom';
import '../../../styles/base/menu.css';
import logo from '../../../assets/img/Gipsy_imagotipo_medioBlanco_deprecated.png'

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const Sidebar = ({ activePage, sidebarActive, closeSidebar, onLogout }) => {
  const isActive = (page) => activePage === page;
  const { user } = useAuth();
  const hasRole = (roleId) => {
    if (!user) return false;
    // roles may be array of ids or objects
    return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
  };
  const isEditor = hasRole(11);
  const isLector = hasRole(12); // rol Lector de Documentos
  const isOnlyLector = isLector && !isEditor;

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`} id="sidebarAdminAvailability">
        <div className="logo">
            <Link to="/availability" onClick={closeSidebar}>
              <img src={logo} alt="Logo" />
            </Link>
        </div>
        <div className="containerSideBar">
          <ul>
            <li>
              <div className={`optionContainer ${isActive('home') ? 'active' : ''}`}>
                <Link to="/availability" className="optionLink" onClick={closeSidebar}>Inicio</Link>
              </div>
            </li>
          </ul>

          <ul className="bottomMenu">
            {/* Redireccionamiento a templates de Flask */}
            <li>
              <div className={`optionContainer ${isActive('home') ? '' : ''}`}>
                <a href={`${apiUrl}/welcome`} className="optionLink" onClick={closeSidebar}>Menú Principal</a>
              </div>
            </li>
            <li>
              <div className={`optionContainer ${isActive('login') ? 'active' : ''}`}>
                <a href={`${apiUrl}/`} className="optionLink">Cerrar Sesión</a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;