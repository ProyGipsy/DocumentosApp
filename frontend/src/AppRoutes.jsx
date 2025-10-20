import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

import HomeGeneral from './components/general/HomeGeneral.jsx';
import DocumentList from './components/general/DocumentList.jsx';
import SendDocuments from './components/general/SendDocuments.jsx';

export default function AppRoutes(){
    return (
        <Routes>
            {/* Paths from the App */}
            <Route path="/" element={<HomeGeneral/>} />

            <Route 
                path="/:folderName" 
                element={<DocumentListWrapper />} 
            />

            <Route 
                path="/send-documents" 
                element={<SendDocuments />} 
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