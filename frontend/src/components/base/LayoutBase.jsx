import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../styles/base/menu.css';
import '../../styles/base/home.css';

const LayoutBaseAdmin = ({ activePage, children }) => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarActive(!sidebarActive);
  const closeSidebar = () => setSidebarActive(false);
  const onLogout = () => {
    sessionStorage.removeItem('session_token');
    navigate('/');
  }
  
  return (
    <div className="layout">
      {/* El Sidebar ahora es un componente separado */}
      <Sidebar
        activePage={activePage}
        sidebarActive={sidebarActive}
        closeSidebar={closeSidebar}
        onLogout={onLogout}
      />

      {/* Contenido principal */}
      <div className={`main-content ${sidebarActive ? 'sidebar-open' : ''}`} id='mainContentAdmin'>
        {children}
      </div>
    </div>
  );
};

export default LayoutBaseAdmin;