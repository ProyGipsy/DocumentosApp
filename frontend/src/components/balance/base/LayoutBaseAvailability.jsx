import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../utils/AuthContext';

// Logo
import logo from '../../../assets/img/Gipsy_imagotipo_medioBlanco_deprecated.png';

// Importaciones de Material UI
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

// Iconos de Material UI
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 285;

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const LayoutBaseAvailability = ({ activePage, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar el menú en pantallas móviles
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lógica de roles extraída de tu componente original
  const hasRole = (roleId) => {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
  };
  const isEditor = hasRole(11);
  const isLector = hasRole(12);
  const isOnlyLector = isLector && !isEditor;

  // Manejadores
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeSidebarOnMobile = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  // --- CONTENIDO DEL SIDEBAR (Oscuro para que resalte el logo blanco) ---
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#262626', color: '#f4f4f4' }}>
      
      {/* Área del Logo */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '64px' }}>
        <Link to="/availability/" onClick={closeSidebarOnMobile} style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={logo} 
            alt="Logo Gipsy" 
            style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} 
          />
        </Link>
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      
      {/* Opciones Superiores (Internas de React) */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        <ListItem disablePadding>
          {/* Usamos component={Link} para que MUI lo trate como un Link de React Router */}
          <ListItemButton 
            component={Link}
            to="/availability/"
            selected={activePage === 'home'} 
            onClick={closeSidebarOnMobile}
            sx={{
              // 1. Estado cuando está seleccionado (Click activo)
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRight: '4px solid #ffffff'
              },
              // 2. Estado cuando está seleccionado Y pasas el mouse (¡ESTO ELIMINA EL AZUL!)
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              },
              // 3. Estado cuando NO está seleccionado y pasas el mouse
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.08)' 
              }
            }}
          >
            <ListItemIcon>
              <HomeIcon sx={{ color: activePage === 'home' ? '#ffffff' : '#b3b3b3' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Inicio" 
              sx={{ color: activePage === 'home' ? '#ffffff' : '#b3b3b3', '& .MuiTypography-root': { fontWeight: activePage === 'home' ? 'bold' : 'normal' } }} 
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      
      {/* Menú Inferior (Redireccionamiento a Flask) */}
      <List>
        <ListItem disablePadding>
          {/* Usamos component="a" y href para redireccionar fuera de React */}
          <ListItemButton 
            component="a" 
            href={`${apiUrl}/welcome`} 
            onClick={closeSidebarOnMobile}
            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
          >
            <ListItemIcon>
              <AppsIcon sx={{ color: '#b3b3b3' }} />
            </ListItemIcon>
            <ListItemText primary="Menú Principal" sx={{ color: '#b3b3b3' }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            component="a" 
            href={`${apiUrl}/`} 
            sx={{ '&:hover': { backgroundColor: 'rgba(255, 77, 79, 0.1)' } }}
          >
            <ListItemIcon>
              <LogoutIcon sx={{ color: '#ff4d4f' }} />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" sx={{ color: '#ff4d4f', '& .MuiTypography-root': { fontWeight: 'bold' } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      
      {/* BARRA SUPERIOR (Solo se ve en móviles para mostrar el botón de menú) */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: 'none' },
          backgroundColor: '#262626'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Gipsy App
          </Typography>
        </Toolbar>
      </AppBar>

      {/* CONTENEDOR DEL SIDEBAR */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        
        {/* VERSIÓN MÓVIL: Se abre por encima de la pantalla */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* VERSIÓN ESCRITORIO: Fija a la izquierda */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* CONTENIDO PRINCIPAL DE TUS VISTAS */}
      <Box component="main" sx={{ flexGrow: 1, p: 0, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar sx={{ display: { sm: 'none' } }} /> {/* Espaciador móvil */}
        {children}
      </Box>
    </Box>
  );
};

export default LayoutBaseAvailability;