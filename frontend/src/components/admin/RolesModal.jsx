import React, { useState, useEffect, useRef } from 'react';
import '../../styles/general/sendDocModal.css';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const RolesModal = ({ isOpen, onClose, mode = 'add', role = null, onSave }) => {

  /*const [permissionOptions, setPermissionOptions] = useState([]);*/
  const [userOptions, setUserOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    // permisos: [], // Comentado
    usuarios: [] 
  });

  // Carga inicial de opciones (Solo Usuarios ahora)
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        // Solo hacemos fetch de usuarios
        const [/*permRes,*/userRes] = await Promise.all([
          // fetch(`${apiUrl}/documents/getPermissions`), // Comentado
            fetch(`${apiUrl}/documents/getUsers`)
        ]);

        /* if (permRes.ok) {
            const data = await permRes.json();
            setPermissionOptions(data);
        }
        */

        if (userRes.ok) {
            const data = await userRes.json();
            setUserOptions(data);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Sincronización del formulario al abrir (Edit vs Create)
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        console.log("Rol a editar:", role);
        setFormData({
          id: role.id,
          name: role.name || '',
          // permisos: Array.isArray(role.permisos) ? role.permisos : [], // Comentado
          usuarios: Array.isArray(role.usuarios) ? role.usuarios : []
        });
      } else {
        setFormData({ id: '', name: '', /*permisos: [],*/ usuarios: [] });
      }
    }
  }, [isOpen, mode, role]);

  // const [isPermisosOpen, setIsPermisosOpen] = useState(false); // Comentado
  const [isUsuariosOpen, setIsUsuariosOpen] = useState(false);
  // const permisoRef = useRef(null); // Comentado
  const usuarioRef = useRef(null);

  // Click Outside para cerrar dropdowns
  /*
  useEffect(() => {
    const handleClickOutside = (e) => {
      // if (permisoRef.current && !permisoRef.current.contains(e.target)) setIsPermisosOpen(false); // Comentado
      if (usuarioRef.current && !usuarioRef.current.contains(e.target)) setIsUsuariosOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  */
 
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* --- Lógica Permisos (COMENTADA TOTALMENTE) ---
  const handleTogglePermiso = (permisoOption) => {
    setFormData(prev => {
      // Normalizamos la búsqueda del ID
      const exists = prev.permisos.some(p => {
          const pID = p.id || p.permissionId; // Soporta ambas claves
          return String(pID) === String(permisoOption.id);
      });

      let newPermisos;
      if (exists) {
        // Filtrar (Eliminar)
        newPermisos = prev.permisos.filter(p => {
            const pID = p.id || p.permissionId;
            return String(pID) !== String(permisoOption.id);
        });
      } else {
        // Agregar (Usamos el formato del option para estandarizar)
        newPermisos = [...prev.permisos, { id: permisoOption.id, name: permisoOption.name }];
      }
      return { ...prev, permisos: newPermisos };
    });
  };
  */

  // --- Lógica Usuarios ---
  const handleToggleUsuario = (usuarioOption) => {
    setFormData(prev => {
      const exists = prev.usuarios.some(u => {
          const uID = u.id || u.userId;
          return String(uID) === String(usuarioOption.id);
      });
      
      let newUsuarios;
      if (exists) {
        newUsuarios = prev.usuarios.filter(u => {
            const uID = u.id || u.userId;
            return String(uID) !== String(usuarioOption.id);
        });
      } else {
        newUsuarios = [...prev.usuarios, { id: usuarioOption.id, fullName: usuarioOption.fullName }];
      }
      
      return { ...prev, usuarios: newUsuarios };
    });
  };

  const handleSave = async () => {
    setIsLoading(true);

    if (!formData.name) {
      alert('Por favor, ingrese un nombre para el rol.');
      setIsLoading(false);
      return;
    }

    /* // Validación opcional comentada
    if (formData.permisos.length === 0 || formData.usuarios.length === 0) {
        if(!confirm("El rol no tiene permisos o usuarios asignados. ¿Desea guardarlo así?"));
        setIsLoading(false);
        return;
    }

    // Normalizar IDs antes de enviar (backend espera 'id' en los objetos)
    const normalizedPermisos = formData.permisos.map(p => ({
        id: p.id || p.permissionId,
        name: p.name
    }));
    */

    const normalizedUsuarios = formData.usuarios.map(u => ({
        id: u.id || u.userId,
        fullName: u.fullName || u.username 
    }));

    const roleToSave = {
      id: mode === 'edit' ? formData.id : 0,
      name: formData.name,
      // permisos: normalizedPermisos, // Comentado: No enviamos permisos
      usuarios: normalizedUsuarios 
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
      
      // Callback al padre para actualizar la tabla
      if (onSave) {
          onSave(roleToSave, mode);
      }
      onClose();

    } catch (error) {
      console.error(`Error al ${mode === 'add' ? 'agregar' : 'editar'} el rol:`, error);
      alert("Error al guardar el rol. Revise la consola.");
    } finally {
      setIsLoading(false);
    }
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
              <input type="text" value={formData.id} readOnly disabled className="text-input disabled-input" />
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

          {/* --- SECCIÓN PERMISOS (COMENTADA EN EL JSX) --- */}
          {/*
          <div className="form-group-user">
            <label>Permisos <span className="required-asterisk">*</span></label>
            <div className="permisos-container-modal" ref={permisoRef} style={{ position: 'relative' }}>
              <div
                className="permiso-dropdown-toggle"
                onClick={(e) => { e.stopPropagation(); setIsPermisosOpen(prev => !prev); }}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
              >
                <div className="selected-summary" style={{ flex: 1, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formData.permisos && formData.permisos.length > 0 
                    ? `${formData.permisos.length} Permisos seleccionados`
                    : 'Seleccione los permisos ...'}
                </div>
                <div className="caret">▾</div>
              </div>

              {isPermisosOpen && (
                <div className="dropdown-panel" style={{ position: 'absolute', width: '100%', maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}>
                  {permissionOptions.map(opt => {
                      const isSelected = formData.permisos.some(p => {
                          const pID = p.id || p.permissionId;
                          return String(pID) === String(opt.id);
                      });
                      
                      return (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePermiso(opt)}
                          />
                          <span>{opt.name}</span>
                        </label>
                      );
                  })}
                </div>
              )}
            </div>
          </div>
          <br />
          */}
          
          {/* --- SECCIÓN USUARIOS --- */}
          <label>Usuarios <span className="required-asterisk">*</span></label>
          <div className="users-container-modal" ref={usuarioRef} style={{ position: 'relative' }}>
            <div
              className="usuario-dropdown-toggle"
              onClick={(e) => { e.stopPropagation(); setIsUsuariosOpen(prev => !prev); }}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
            >
              <div className="selected-summary" style={{ flex: 1, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formData.usuarios && formData.usuarios.length > 0 
                  ? `${formData.usuarios.length} Usuarios seleccionados`
                  : 'Seleccione los usuarios ...'}
              </div>
              <div className="caret">▾</div>
            </div>

            {isUsuariosOpen && (
              <div className="dropdown-panel" style={{ position: 'absolute', width: '100%', maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}>
                {userOptions.map(opt => {
                    const isSelected = formData.usuarios.some(u => {
                      const uID = u.id || u.userId;
                      return String(uID) === String(opt.id);
                    });

                    return (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleUsuario(opt)}
                        />
                        <span>{opt.fullName}</span>
                      </label>
                    );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (mode === 'edit' ? 'Guardando cambios...' : 'Agregando Rol...') : (mode === 'edit' ? 'Guardar cambios' : 'Agregar Rol')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesModal;