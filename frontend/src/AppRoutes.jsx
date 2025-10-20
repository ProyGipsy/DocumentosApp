import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomeGeneral from './components/general/HomeGeneral.jsx';

export default function AppRoutes(){
    return (
        <Routes>
            {/* Paths from the App */}
            <Route path="/" element={<HomeGeneral/>} />
        </Routes>
    );
}