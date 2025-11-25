import React, { useState, useEffect, useRef } from 'react';
import '../../styles/general/sendDocModal.css';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const RolesModal = ({ isOpen, onClose, mode = 'add', role = null, onSave }) => {

  const [permissionOptions, setPermissionOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    permisos: [], // Array de objetos {id, name}
    usuarios: []  // Array de objetos {id, fullName}
  });

  useEffect(() => {
    const fetchPermissionOptions = async () => {
      setIsLoading(true);
      try {
        const reponse = await fetch(`${apiUrl}/documents/getPermissions`);
        if (!reponse.ok) throw new Error(`Error HTTP: ${reponse.status}`);
        const data = await reponse.json();
        console.log(data)
        setPermissionOptions(data);
      } catch (error) {
        console.error('Error fetching permission options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissionOptions();
  }, []);

  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        const response = await fetch(`${apiUrl}/documents/getUsers`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        console.log(data)
        setUserOptions(data);
      } catch (error) {
        console.error('Error fetching user options:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserOptions();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setFormData({
          id: role.id,
          name: role.name || '',
          permisos: Array.isArray(role.permisos) ? role.permisos : (role.permisos ? [role.permisos] : []),
          usuarios: Array.isArray(role.usuarios) ? role.usuarios : (role.usuarios ? [role.usuarios] : [])
        });
      } else {
        setFormData({ id: '', name: '', permisos: [], usuarios: [] });
      }
    }
  }, [isOpen, mode, role]);

  const [isPermisosOpen, setIsPermisosOpen] = useState(false);
  const [isUsuariosOpen, setIsUsuariosOpen] = useState(false);
  const permisoRef = useRef(null);
  const usuarioRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (permisoRef.current && !permisoRef.current.contains(e.target)) setIsPermisosOpen(false);
      if (usuarioRef.current && !usuarioRef.current.contains(e.target)) setIsUsuariosOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Lógica Permisos (Objetos) ---
  const handleTogglePermiso = (permisoOption) => {
    setFormData(prev => {
      const exists = prev.permisos.some(p => p.id === permisoOption.id);
      let newPermisos;
      if (exists) {
        newPermisos = prev.permisos.filter(p => p.id !== permisoOption.id);
      } else {
        newPermisos = [...prev.permisos, permisoOption];
      }
      return { ...prev, permisos: newPermisos };
    });
  };

  // --- Lógica Usuarios (Objetos) ---
  const handleToggleUsuario = (usuarioOption) => {
    setFormData(prev => {
      // Usamos .some() para verificar por ID en lugar de includes()
      const exists = prev.usuarios.some(u => u.id === usuarioOption.id);
      
      let newUsuarios;
      if (exists) {
        // Filtramos por ID para eliminar
        newUsuarios = prev.usuarios.filter(u => u.id !== usuarioOption.id);
      } else {
        // Agregamos el objeto completo
        newUsuarios = [...prev.usuarios, usuarioOption];
      }
      
      return { ...prev, usuarios: newUsuarios };
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.permisos || formData.permisos.length === 0 || !formData.usuarios || formData.usuarios.length === 0) {
      alert('Por favor, complete Nombre, seleccione al menos un Permiso y al menos un Usuario.');
      return;
    }

    const roleToSave = {
      id: mode === 'edit' ? formData.id : 0,
      name: formData.name,
      permisos: formData.permisos, // Array de objetos
      usuarios: formData.usuarios  // Array de objetos
    };

    console.log('Guardando rol:', roleToSave);

    const endpoint = mode === 'add' ? '/documents/addRole' : '/documents/editRole';
    const method = mode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleToSave)
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      if (data) {
        const newRoleForState = { ...roleToSave, id: data.role_id}
        onSave && onSave(newRoleForState, mode);
      }
    } catch (error) {
      console.error(`Error al ${mode === 'add' ? 'agregar' : 'editar'} el rol:`, error);
    }

    onClose();
  };

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user" style={{ maxWidth: '500px' }}>
        <div className="modal-header-user">
          <h3>{mode === 'edit' ? 'Editar Rol' : 'Agregar Nuevo Rol'}</h3>
          <button className="close-button-user" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body-user">
          {mode === 'edit' && (
            <div className="form-group-user">
              <label>ID</label>
              <input
                type="text"
                value={formData.id}
                readOnly
                disabled
                className="text-input disabled-input"
              />
            </div>
          )}

          <div className="form-group-user">
            <label>Nombre del Rol <span className="required-asterisk">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Administrador"
            />
          </div>

          {/* --- SECCIÓN PERMISOS --- */}
          <div className="form-group-user">
            <label>Permisos <span className="required-asterisk">*</span></label>
            <div className="permisos-container-modal" ref={permisoRef} style={{ position: 'relative' }}>
              <div
                className="permiso-dropdown-toggle"
                onClick={(e) => { e.stopPropagation(); setIsPermisosOpen(prev => !prev); }}
                role="button"
                aria-expanded={isPermisosOpen}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
              >
                <div className="selected-summary" style={{ flex: 1, marginRight: 8 }}>
                  {formData.permisos && formData.permisos.length > 0 
                    ? formData.permisos.map(p => p.name).join(', ') 
                    : 'Seleccione los permisos ...'}
                </div>
                <div className="caret">▾</div>
              </div>

              {isPermisosOpen && (
                <div className="dropdown-panel" style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}>
                  <div className="permiso-type checkbox-list">
                    {permissionOptions.map(opt => {
                        const isSelected = formData.permisos.some(p => p.id === opt.id);
                        return (
                          <label key={opt.id} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                            <input
                              type="checkbox"
                              name="permisos"
                              value={opt.id}
                              checked={isSelected}
                              onChange={() => handleTogglePermiso(opt)}
                            />
                            <span>{opt.name}</span>
                          </label>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <br />
            
            {/* --- SECCIÓN USUARIOS (ACTUALIZADA) --- */}
            <label>Usuarios <span className="required-asterisk">*</span></label>
            <div className="users-container-modal" ref={usuarioRef} style={{ position: 'relative' }}>
              <div
                className="usuario-dropdown-toggle"
                onClick={(e) => { e.stopPropagation(); setIsUsuariosOpen(prev => !prev); }}
                role="button"
                aria-expanded={isUsuariosOpen}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
              >
                {/* Visualizar solo nombres (fullName) */}
                <div className="selected-summary" style={{ flex: 1, marginRight: 8 }}>
                  {formData.usuarios && formData.usuarios.length > 0 
                    ? formData.usuarios.map(u => u.fullName).join(', ') 
                    : 'Seleccione los usuarios ...'}
                </div>
                <div className="caret">▾</div>
              </div>

              {isUsuariosOpen && (
                <div className="dropdown-panel" style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}>
                  <div className="usuario-type checkbox-list">
                    {userOptions.map(opt => {
                      // Verificar si existe el ID en el estado
                      const isSelected = formData.usuarios.some(u => {
                        const storedID = u.userId || u.id;
                        return storedID === opt.id;
                      });
                      return (
                        <label key={opt.id} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                          <input
                            type="checkbox"
                            name="usuarios"
                            value={opt.id}
                            checked={isSelected}
                            // Pasamos el objeto completo 'opt'
                            onChange={() => handleToggleUsuario(opt)}
                          />
                          <span>{opt.fullName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSave}>
            {mode === 'edit' ? 'Guardar cambios' : 'Agregar Rol'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesModal;