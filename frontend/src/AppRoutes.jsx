import React from 'react';
import { Routes, Route } from 'react-router-dom';

export default function AppRoutes(){
    return (
        <Routes>
            {/* Paths from the App */}
            <Route path="/" element={<div>Home Page de Módulo de Documentos</div>} />
        </Routes>
    );
}