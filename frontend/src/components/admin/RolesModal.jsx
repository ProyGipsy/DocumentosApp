import React, { useState, useEffect, useRef } from 'react';
import '../../styles/general/sendDocModal.css';

const PermissionOptions = [
  'PermisoAdministrador',
  'PermisoVendedor',
  'Gráficos Flujo de Caja',
  'Reportes de Ventas',
  'Reportes Flujo de Caja',
  'Reportes Saldos de Cuentas',
  'Reportes Comisiones de Vendedores',
  'Reportes Resumen IVA',
  'Reportes de Garantías',
  'RIF',
  'Contrato de Arrendamiento',
  'Vehículos',
  'Poderes',
  'Permiso Sanitario Locales',
  'Registros Mercantiles',
  'Patente',
  'Corpoelec',
  'Registro Sanitario',
  'Pólizas Seguro',
  'Dominios',
];

const UserOptions = [
  'Login1965',
  'fhenao',
  'armandoc',
  'josem',
  'tinadivasta',
  'jars',
  'yarima',
  'danielhdez'
]

const RolesModal = ({ isOpen, onClose, mode = 'add', role = null, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    // store permisos and usuarios as arrays so multiple selections are possible
    permisos: [],
    usuarios: []
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setFormData({
          id: role.id || '',
          name: role.name || '',
          // ensure permisos and usuarios are arrays
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

  // Close dropdowns when clicking outside
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

  const handleTogglePermiso = (permiso) => {
    setFormData(prev => {
      const exists = prev.permisos.includes(permiso);
      const permisos = exists ? prev.permisos.filter(p => p !== permiso) : [...prev.permisos, permiso];
      return { ...prev, permisos };
    });
  };

  const handleToggleUsuario = (usuario) => {
    setFormData(prev => {
      const exists = prev.usuarios.includes(usuario);
      const usuarios = exists ? prev.usuarios.filter(u => u !== usuario) : [...prev.usuarios, usuario];
      return { ...prev, usuarios };
    });
  };

  const handleSave = () => {
    // validate required fields: name, at least one permiso, at least one usuario
    if (!formData.name || !formData.permisos || formData.permisos.length === 0 || !formData.usuarios || formData.usuarios.length === 0) {
      alert('Por favor, complete Nombre, seleccione al menos un Permiso y al menos un Usuario.');
      return;
    }

    const roleToSave = {
      id: formData.id || Date.now() + Math.floor(Math.random() * 1000),
      name: formData.name,
      permisos: formData.permisos,
      usuarios: formData.usuarios
    };

    onSave && onSave(roleToSave, mode);
    onClose();
  };

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user" style={{ maxWidth: '500px' }}>
        <div className="modal-header-user">
          <h3>{mode === 'edit' ? 'Editar Rol' : 'Agregar Nuevo Rol'}</h3>
          <button className="close-button-user" onClick={onClose}>&times;</button>
        </div>

        {/* Campo ID */}
        <div className="modal-body-user">
          {mode === 'edit' && (
            <div className="form-group-user">
              <label>ID</label>
              <input
                type="text"
                value={formData.id}
                readOnly
                disabled={mode === 'edit'}
                className={mode === 'edit' ? 'text-input disabled-input' : 'text-input'}
              />
            </div>
          )}

          {/* Campo Nombre del Rol */}
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

          {/* Campo Permisos */}
          <div className="form-group-user">
            <label>Permisos <span className="required-asterisk">*</span></label>
            <div className="permisos-container-modal" ref={permisoRef} style={{ position: 'relative' }}>
              {/* Dropdown toggle showing selected permisos */}
              <div
                className="permiso-dropdown-toggle"
                onClick={(e) => { e.stopPropagation(); setIsPermisosOpen(prev => !prev); }}
                role="button"
                aria-expanded={isPermisosOpen}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
              >
                <div className="selected-summary" style={{ flex: 1, marginRight: 8 }}>
                  {formData.permisos && formData.permisos.length > 0 ? formData.permisos.join(', ') : 'Seleccione los permisos ...'}
                </div>
                <div className="caret">▾</div>
              </div>

              {isPermisosOpen && (
                <div
                  className="dropdown-panel"
                  style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}
                >
                  <div className="permiso-type checkbox-list">
                    {PermissionOptions.map(opt => (
                      <label key={opt} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                        <input
                          type="checkbox"
                          name="permisos"
                          value={opt}
                          checked={formData.permisos.includes(opt)}
                          onChange={() => handleTogglePermiso(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <br />
            {/* Campo Usuarios */}
            <label>Usuarios <span className="required-asterisk">*</span></label>
            <div className="users-container-modal" ref={usuarioRef} style={{ position: 'relative' }}>
              <div
                className="usuario-dropdown-toggle"
                onClick={(e) => { e.stopPropagation(); setIsUsuariosOpen(prev => !prev); }}
                role="button"
                aria-expanded={isUsuariosOpen}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ccc', padding: '8px', borderRadius: 4, background: '#fff' }}
              >
                <div className="selected-summary" style={{ flex: 1, marginRight: 8 }}>
                  {formData.usuarios && formData.usuarios.length > 0 ? formData.usuarios.join(', ') : 'Seleccione los usuarios ...'}
                </div>
                <div className="caret">▾</div>
              </div>

              {isUsuariosOpen && (
                <div
                  className="dropdown-panel"
                  style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, padding: 8, borderRadius: 4 }}
                >
                  <div className="usuario-type checkbox-list">
                    {UserOptions.map(opt => (
                      <label key={opt} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                        <input
                          type="checkbox"
                          name="usuarios"
                          value={opt}
                          checked={formData.usuarios.includes(opt)}
                          onChange={() => handleToggleUsuario(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="modal-footer-user">
          <button className="modal-button-user save-button-user" onClick={handleSave}>
            {mode === 'edit' ? 'Guardar cambios' : 'Agregar Empresa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesModal;