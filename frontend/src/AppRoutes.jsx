import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

/*  Rutas para el modulo de Documentos */
import HomeGeneral from './components/documents/general/HomeGeneral.jsx';
import DocumentList from './components/documents/general/DocumentList.jsx';
import SendDocuments from './components/documents/general/SendDocuments.jsx';
import CreateDocumentType from './components/documents/general/DocumentTypeForm.jsx';
import CreateDocument from './components/documents/general/CreateDocumentForm.jsx';

import Companies from './components/documents/admin/Companies.jsx';
import Roles from './components/documents/admin/Roles.jsx';
import Contacts from './components/documents/admin/Contacts.jsx';

/* Rutas para el modulo de Disponibilidad */
import AvailabilityHome from './components/balance/general/AvailabilityHome.jsx';

export default function AppRoutes(){
    return (
        <Routes>
            {/* Rutas de Documentos */}
            <Route path="/documents" element={<HomeGeneral/>} />

            <Route 
                path="/documents/:folderName" 
                element={<DocumentListWrapper />} 
            />

            <Route 
                path="/documents/send-documents" 
                element={<SendDocuments />} 
            />

            <Route 
                path="/documents/document-type" 
                element={<CreateDocumentType />} 
            />

            <Route 
                path="/documents/document-create" 
                element={<CreateDocument />} 
            />

            {/* Rutas de Admin*/}
            <Route 
                path="/documents/companies" 
                element={<Companies />} 
            />

            <Route
                path="/documents/roles"
                element={<Roles />}
            />

            <Route
                path="/documents/contacts"
                element={<Contacts />}
            />

            {/* Rutas de Disponibilidad */}
            <Route
                path="/availability"
                element={<AvailabilityHome />}
            />
            
        </Routes>
    );
}

const DocumentListWrapper = () => {
    const { folderName } = useParams();
    // Decodificar el nombre por si tiene espacios o caracteres especiales
    const decodedFolderName = decodeURIComponent(folderName); 
    return <DocumentList folderName={decodedFolderName} />;
}