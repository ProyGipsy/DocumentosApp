import React, { useState, useEffect } from 'react';
import '../../styles/general/sendDocModal.css';

const RIFtypeOptions = ['J', 'G', 'V', 'E', 'P'];

const CompaniesModal = ({ isOpen, onClose, mode = 'add', company = null, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    RIFtype: '',
    RIF: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && company) {
        const rifParts = (company.rif || '').split('-');
        setFormData({
          id: company.id || '',
          name: company.name || '',
          RIFtype: rifParts[0] || '',
          RIF: rifParts.slice(1).join('-') || ''
        });
      } else {
        setFormData({ id: '', name: '', RIFtype: '', RIF: '' });
      }
    }
  }, [isOpen, mode, company]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si es RIF y es number type, limitar longitud a 10
    if (name === 'RIF') {
      const val = String(value).replace(/[^0-9-]/g, '');
      // limitar a 10 dígitos (sin contar guiones)
      const digits = val.replace(/-/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.RIFtype || !formData.RIF) {
      alert('Por favor, complete Nombre y RIF (tipo y número).');
      return;
    }

    const rifCombined = `${formData.RIFtype}-${formData.RIF}`;
    const companyToSave = {
      id: formData.id || Date.now() + Math.floor(Math.random() * 1000),
      name: formData.name,
      rif: rifCombined
    };

    onSave && onSave(companyToSave, mode);
    onClose();
  };

  return (
    <div className="modal-overlay-user">
      <div className="modal-content-user" style={{ maxWidth: '500px' }}>
        <div className="modal-header-user">
          <h3>{mode === 'edit' ? 'Editar Empresa' : 'Agregar Nueva Empresa'}</h3>
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

          {/* Campo Nombre de la Empresa */}
          <div className="form-group-user">
            <label>Nombre de la Empresa <span className="required-asterisk">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Gipsy S.A."
            />
          </div>

          {/* Campo RIF */}
          <div className="form-group-user">
            <label>RIF <span className="required-asterisk">*</span></label>
            <div className="rif-container-modal">
              {/* Tipo de Rif (Prefijo) */}
              <div className="rif-type">
                <select
                  id="RIFtype"
                  name="RIFtype"
                  value={formData.RIFtype}
                  onChange={handleChange}
                >
                  <option value="">Tipo</option>
                  {RIFtypeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Número de Rif */}
              <div className="rif-number">
                <input
                  type="number"
                  id="RIF"
                  name="RIF"
                  placeholder="Número de RIF"
                  max={9999999999}
                  required
                  value={formData.RIF}
                  onChange={handleChange}
                />
              </div>
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

export default CompaniesModal;