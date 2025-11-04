import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/base/menu.css';
import logo from '../../assets/img/Gipsy_imagotipo_color.png'

const Sidebar = ({ activePage, sidebarActive, closeSidebar, onLogout }) => {
  const isActive = (page) => activePage === page;

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
            <li>
              <div className={`optionContainer ${isActive('documentType') ? 'active' : ''}`}>
                <Link to="/document-type" className="optionLink" onClick={closeSidebar}>Crear Tipo de Documento</Link>
              </div>
            </li>
            <li>
              <div className={`optionContainer ${isActive('documents') ? 'active' : ''}`}>
                <Link to="/" className="optionLink" onClick={closeSidebar}>Crear Documento</Link>
              </div>
            </li>
            <li>
              <div className={`optionContainer ${isActive('sendDocuments') ? 'active' : ''}`}>
                <Link to="/send-documents" className="optionLink" onClick={closeSidebar}>Enviar Documentos</Link>
              </div>
            </li>
            {/* Funciones para usuarios de Rol Administrador */}
            <li className="AdminMenu">
              <div className={`optionContainer ${isActive('roles') ? '' : ''}`}>
                <Link to="/roles" className="optionLink" onClick={closeSidebar}>Gestionar Roles</Link>
              </div>
            </li>
            <li>
              <div className={`optionContainer ${isActive('companies') ? 'active' : ''}`}>
                <Link to="/companies" className="optionLink" onClick={closeSidebar}>Gestionar Empresas</Link>
              </div>
            </li>
          </ul>

          <ul className="bottomMenu">
            {/* Redireccionamiento a templates de Flask */}
            <li>
              <div className={`optionContainer ${isActive('home') ? '' : ''}`}>
                <a href="/welcome" className="optionLink" onClick={closeSidebar}>Menú Principal</a>
              </div>
            </li>
            <li>
              <div className={`optionContainer ${isActive('login') ? 'active' : ''}`}>
                <a href="/login" className="optionLink">Cerrar Sesión</a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;