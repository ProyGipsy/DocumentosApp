import React from 'react';
import { useAuth } from '../../utils/AuthContext';
import { Link } from 'react-router-dom';
import '../../styles/base/menu.css';
import logo from '../../assets/img/Gipsy_imagotipo_color.png'

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
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`} id="sidebarAdmin">
        <div className="logo">
            <Link to="/" onClick={closeSidebar}>
              <img src={logo} alt="Logo" />
            </Link>
        </div>
        <div className="containerSideBar">
          <ul>
            <li>
              <div className={`optionContainer ${isActive('home') ? 'active' : ''}`}>
                <Link to="/" className="optionLink" onClick={closeSidebar}>Inicio</Link>
              </div>
            </li>
            {!isOnlyLector && (
              <>
                <li>
                  <div className={`optionContainer ${isActive('documentType') ? 'active' : ''}`}>
                    <Link to="/document-type" className="optionLink" onClick={closeSidebar}>Crear Tipo de Documento</Link>
                  </div>
                </li>
                <li>
                  <div className={`optionContainer ${isActive('documents') ? 'active' : ''}`}>
                    <Link to="/document-create" className="optionLink" onClick={closeSidebar}>Crear Documento</Link>
                  </div>
                </li>
              </>
            )}
            <li>
              <div className={`optionContainer ${isActive('sendDocuments') ? 'active' : ''}`}>
                <Link to="/send-documents" className="optionLink" onClick={closeSidebar}>Enviar Documentos</Link>
              </div>
            </li>
            {/* Funciones para usuarios de Rol Administrador */}
            {!isOnlyLector && (
              <>
                <li className="AdminMenu">
                  <div className={`optionContainer ${isActive('roles') ? 'active' : ''}`}>
                    <Link to="/roles" className="optionLink" onClick={closeSidebar}>Gestionar Roles</Link>
                  </div>
                </li>
                <li>
                  <div className={`optionContainer ${isActive('companies') ? 'active' : ''}`}>
                    <Link to="/companies" className="optionLink" onClick={closeSidebar}>Gestionar Entidades</Link>
                  </div>
                </li>
                <li>
                  <div className={`optionContainer ${isActive('contacts') ? 'active' : ''}`}>
                    <Link to="/contacts" className="optionLink" onClick={closeSidebar}>Gestionar Contactos</Link>
                  </div>
                </li>
              </>
            )}
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