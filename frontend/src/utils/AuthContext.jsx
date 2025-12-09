import React, { createContext, useState, useEffect, useContext } from 'react';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      let token = params.get('token'); 

      if (token) {
        localStorage.setItem('docs_auth_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        token = localStorage.getItem('docs_auth_token');
      }

      if (token) {
        try {
          const response = await fetch(`${apiUrl}/documents/getUser`, { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user); 
          } else {
            console.error('Token inválido o expirado');
            localStorage.removeItem('docs_auth_token'); // Limpiamos token malo
          }
        } catch (error) {
          console.error('Error en el fetch:', error);
        }
      } else {
        console.log('No hay sesión activa');
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);