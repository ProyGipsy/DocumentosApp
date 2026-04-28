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
import HomeIcon from '@mui/icons-material/AddCard';
import ReceptionIcon from '@mui/icons-material/CreditScore';
import BeneficiariesIcon from '@mui/icons-material/People';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 285;

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const LayoutBasePurchases = ({ activePage, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- LÓGICA DE ROLES ---
  const hasRole = (roleId) => {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.some(r => (typeof r === 'number' ? r === roleId : (r.id === roleId || r.roleId === roleId)));
  };
  const isEditor = hasRole(11);
  const isLector = hasRole(12);
  const isOnlyLector = isLector && !isEditor;

  // --- MANEJADORES ---
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const closeSidebarOnMobile = () => { if (mobileOpen) setMobileOpen(false); };

  // DICCIONARIO CENTRALIZADO DE ESTILOS
  const isHomeActive = activePage === 'home';
  const isBeneficiariesActive = activePage === 'beneficiaries';
  const isReceptionActive = activePage === 'reception';

  const styles = {
    // Layout Principal
    rootBox: { display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' },
    appBar: { width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, display: { sm: 'none' }, backgroundColor: '#975cfc', },
    menuIconButton: { mr: 2, display: { sm: 'none' } },
    drawerContainer: { width: { sm: drawerWidth }, flexShrink: { sm: 0 } },
    drawerMobile: { display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } },
    drawerDesktop: { display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } },
    mainContent: { flexGrow: 1, p: 0, width: { sm: `calc(100% - ${drawerWidth}px)` } },
    mobileSpacer: { display: { sm: 'none' } },

    // Contenido del Sidebar
    sidebarBox: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#6d36ce', color: '#f4f4f4' },
    logoContainer: { p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '64px' },
    logoLink: { display: 'flex', alignItems: 'center' },
    logoImg: { maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' },
    divider: { backgroundColor: 'rgba(255,255,255,0.1)' },
    topList: { flexGrow: 1, pt: 2 },

    // Item: Inicio
    homeButton: {
      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRight: '4px solid #ffffff' },
      '&.Mui-selected:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
    },
    homeIcon: { color: isHomeActive ? '#ffffff' : '#b3b3b3' },
    homeText: { color: isHomeActive ? '#ffffff' : '#b3b3b3', '& .MuiTypography-root': { fontWeight: isHomeActive ? 'bold' : 'normal' } },

    // Item: Recepción de fondos
    receptionButton: {
      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRight: '4px solid #ffffff' },
      '&.Mui-selected:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
    },
    receptionIcon: { color: isReceptionActive ? '#ffffff' : '#b3b3b3' },
    receptionText: { color: isReceptionActive ? '#ffffff' : '#b3b3b3', '& .MuiTypography-root': { fontWeight: isReceptionActive ? 'bold' : 'normal' } },

    // Item: Beneficiarios
    beneficiariesButton: {
      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRight: '4px solid #ffffff' },
      '&.Mui-selected:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
    },
    beneficiariesIcon: { color: isBeneficiariesActive ? '#ffffff' : '#b3b3b3' },
    beneficiariesText: { color: isBeneficiariesActive ? '#ffffff' : '#b3b3b3', '& .MuiTypography-root': { fontWeight: isBeneficiariesActive ? 'bold' : 'normal' } },

    // Item: Menú Principal
    menuAppButton: { '&:hover': { backgroundColor: '#ffffff0d' } },
    menuAppIcon: { color: '#f1f1f1' },
    menuAppText: { color: '#f1f1f1', '& .MuiTypography-root': { fontWeight: 'normal' } },

    // Item: Cerrar Sesión
    logoutButton: { '&:hover': { backgroundColor: '#ff4d4f1a' } },
    logoutIcon: { color: '#f1f1f1' },
    logoutText: { color: '#f1f1f1', '& .MuiTypography-root': { fontWeight: 'bold' } },
  };

  // --- CONTENIDO DEL SIDEBAR ---
  const drawerContent = (
    <Box sx={styles.sidebarBox}>
      
      {/* Área del Logo */}
      <Box sx={styles.logoContainer}>
        <Link to="/purchases" onClick={closeSidebarOnMobile} style={styles.logoLink}>
          <img src={logo} alt="Logo Gipsy" style={styles.logoImg} />
        </Link>
      </Box>

      <Divider sx={styles.divider} />
      
      {/* Opciones Superiores */}
      <List sx={styles.topList}>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link}
            to="/purchases"
            selected={isHomeActive} 
            onClick={closeSidebarOnMobile}
            sx={styles.homeButton}
          >
            <ListItemIcon>
              <HomeIcon sx={styles.homeIcon} />
            </ListItemIcon>
            <ListItemText primary="Compra de divisas" sx={styles.homeText} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            component={Link}
            to="/purchases/reception"
            selected={isReceptionActive} 
            onClick={closeSidebarOnMobile}
            sx={styles.receptionButton}
          >
            <ListItemIcon>
              <ReceptionIcon sx={styles.receptionIcon} />
            </ListItemIcon>
            <ListItemText primary="Recepción de fondos" sx={styles.receptionText} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            component={Link}
            to="/purchases/beneficiaries"
            selected={isBeneficiariesActive} 
            onClick={closeSidebarOnMobile}
            sx={styles.beneficiariesButton}
          >
            <ListItemIcon>
              <BeneficiariesIcon sx={styles.beneficiariesIcon} />
            </ListItemIcon>
            <ListItemText primary="Beneficiarios" sx={styles.beneficiariesText} />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={styles.divider} />
      
      {/* Menú Inferior */}
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component="a" 
            href={`${apiUrl}/welcome`} 
            onClick={closeSidebarOnMobile}
            sx={styles.menuAppButton}
          >
            <ListItemIcon>
              <AppsIcon sx={styles.menuAppIcon} />
            </ListItemIcon>
            <ListItemText primary="Menú Principal" sx={styles.menuAppText} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            component="a" 
            href={`${apiUrl}/`} 
            sx={styles.logoutButton}
          >
            <ListItemIcon>
              <LogoutIcon sx={styles.logoutIcon} />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" sx={styles.logoutText} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={styles.rootBox}>
      
      {/* BARRA SUPERIOR (Móviles) */}
      <AppBar position="fixed" sx={styles.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={styles.menuIconButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Gipsy App
          </Typography>
        </Toolbar>
      </AppBar>

      {/* CONTENEDOR DEL SIDEBAR */}
      <Box component="nav" sx={styles.drawerContainer}>
        
        {/* VERSIÓN MÓVIL */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={styles.drawerMobile}
        >
          {drawerContent}
        </Drawer>
        
        {/* VERSIÓN ESCRITORIO */}
        <Drawer
          variant="permanent"
          sx={styles.drawerDesktop}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* CONTENIDO PRINCIPAL */}
      <Box component="main" sx={styles.mainContent}>
        <Toolbar sx={styles.mobileSpacer} />
        {children}
      </Box>
    </Box>
  );
};

export default LayoutBasePurchases;