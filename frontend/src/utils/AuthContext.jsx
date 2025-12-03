import React, { createContext, useState, useEffect, useContext } from 'react';

// Asegúrate de importar tu apiUrl
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/documents/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // <--- ¡ESTA LÍNEA ES OBLIGATORIA!
        });

        if (response.ok) {
          const data = await response.json();
          // Asumiendo que tu backend devuelve { logged_in: true, user: {...} }
          // Ajusta esto según la respuesta real de tu endpoint /me
          if (data.logged_in || data.authenticated) {
             setUser(data.user || data); 
          } else {
             setUser(null);
          }
        } else {
          // Si responde 401 u otro error, no hay usuario
          setUser(null);
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
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