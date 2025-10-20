import React, { useEffect }from 'react';
import LayoutBaseAdmin from '../base/LayoutBase';

const HomeAdmin = () => {
  return (
    <LayoutBaseAdmin activePage="home">
      <div className="content">
        <div className="title-container">
          <div className="title-center">
            <h2>Gestión de Documentos</h2>
          </div>
          <div className="title-center">
            <h3>Bienvenido(a), </h3>
          </div>
        </div>
        
      </div>
    </LayoutBaseAdmin>
  );
};

export default HomeAdmin;