// src/services/authService.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (formData) => {
    const response = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }
};

export const clubService = {
  getAll: () => api.get('/clubs'),
  getMyClub: () => api.get('/clubs/my-club'),
  create: (data) => api.post('/clubs', data),
  updateMyClub: (data) => api.put('/clubs/my-club', data)
};

export const categoriaService = {
  getAll: () => api.get('/categorias'),
  getById: (id) => api.get(`/categorias/${id}`),
  create: (data) => api.post('/categorias', data),
  update: (id, data) => api.put(`/categorias/${id}`, data),
  desactivar: (id) => api.put(`/categorias/${id}/desactivar`)
};

export const torneoService = {
  getAll: () => api.get('/torneos'),
  getActivos: () => api.get('/torneos/activos'),
  getPendientes: () => api.get('/torneos/pendientes'),
  getFinalizados: () => api.get('/torneos/finalizados'),
  getById: (id) => api.get(`/torneos/${id}`),

  getRanking: (torneoId) => api.get(`/torneos/${torneoId}/ranking`),
  create: (data) => api.post('/torneos', data),
  update: (id, data) => api.put(`/torneos/${id}`, data),
  delete: (id) => api.delete(`/torneos/${id}`),
  cambiarEstado: (id, estado) => api.patch(`/torneos/${id}/estado`, { estado }),
  unirse: (torneoId, robotId) => api.post(`/torneos/${torneoId}/unirse`, { robotId }),
  
  // ✅ ENDPOINTS PARA JUEZ
  asignarModalidad: (torneoId, modalidad) => 
    api.post(`/torneos/${torneoId}/asignar-modalidad`, { modalidad }),
  
  // ✅ FUNCIÓN QUE TE FALTABA
  generarEnfrentamientos: (torneoId) => 
    api.post(`/torneos/${torneoId}/generar-enfrentamientos`),
  
  iniciarTorneo: (torneoId) => 
    api.post(`/torneos/${torneoId}/iniciar`),
  
  getEnfrentamientos: (torneoId) => 
    api.get(`/torneos/${torneoId}/enfrentamientos`),
  
  registrarResultado: (torneoId, enfrentamientoId, puntos1, puntos2) => 
    api.put(`/torneos/${torneoId}/enfrentamientos/${enfrentamientoId}/resultado`, {
      puntos1,
      puntos2
    }),
  
  avanzarGanadores: (torneoId) => 
    api.post(`/torneos/${torneoId}/avanzar-ganadores`),

  getBracket: (torneoId) =>
    api.get(`/torneos/${torneoId}/bracket`)
};

export const robotService = {
  getMisRobots: () => api.get('/robots/mis-robots'),
  create: (data) => api.post('/robots', data),
  update: (id, data) => api.put(`/robots/${id}`, data),
  delete: (id) => api.delete(`/robots/${id}`),
  getPendientes: () => api.get('/robots/mi-club/pendientes'),
  aprobar: (id) => api.put(`/robots/${id}/aprobar`),
  rechazar: (id, motivo) => api.put(`/robots/${id}/rechazar`, { motivo })
};

export const solicitudService = {
  getMiClub: () => api.get('/solicitudes/mi-club'),
  aprobar: (id) => api.put(`/solicitudes/${id}/aprobar`),
  rechazar: (id) => api.put(`/solicitudes/${id}/rechazar`)
};

export const userService = {
  getAll: () => api.get('/users'),
  
  // ✅ NUEVO: Obtener lista de jueces
  getJueces: () => api.get('/admin/roles/jueces')
};

export const transferenciaService = {
  // Para competidores
  solicitar: (clubDestinoId, mensaje) => 
    api.post('/transferencias/solicitar', { clubDestinoId, mensaje }),
  
  getMisSolicitudes: () => 
    api.get('/transferencias/mis-solicitudes'),
  
  cancelar: (solicitudId) => 
    api.delete(`/transferencias/${solicitudId}/cancelar`),

  // Para club owners
  getPendientesSalida: () => 
    api.get('/transferencias/pendientes-salida'),
  
  getPendientesIngreso: () => 
    api.get('/transferencias/pendientes-ingreso'),
  
  procesarSalida: (solicitudId, aprobar, motivo = '') => 
    api.put(`/transferencias/${solicitudId}/procesar-salida`, { aprobar, motivo }),
  
  procesarIngreso: (solicitudId, aprobar, motivo = '') => 
    api.put(`/transferencias/${solicitudId}/procesar-ingreso`, { aprobar, motivo }),

    // ✅ NUEVO: Para usuarios sin club (USER degradados)
  solicitarIngresoSinClub: (clubDestinoId, mensaje) => 
    api.post('/transferencias/solicitar-ingreso', { 
      clubDestinoId, 
      mensaje 
    }),

  // ✅ OPCIONAL: Verificar si el club está en deshabilitación
  verificarClubDeshabilitacion: () =>
    api.get('/transferencias/verificar-deshabilitacion')
};

// Agregar al final de authService.js

export const clubDeshabilitacionService = {
  // 🚫 PASO 1: Admin deshabilita club
  deshabilitar: (clubId, motivo, diasLimite = 7) => 
    api.post('/admin/club-deshabilitacion/deshabilitar', { 
      clubId, 
      motivo, 
      diasLimite 
    }),

  // 📤 PASO 2: Enviar solicitudes masivas
  enviarSolicitudesMasivas: (deshabilitacionId, clubDestinoId) =>
    api.post(`/admin/club-deshabilitacion/${deshabilitacionId}/solicitudes-masivas`, {
      clubDestinoId
    }),

  // ⬇️ PASO 3: Degradar miembros restantes
  degradarMiembrosRestantes: (deshabilitacionId) =>
    api.post(`/admin/club-deshabilitacion/${deshabilitacionId}/degradar-restantes`),

  // 📋 Listar deshabilitaciones
  listar: () => 
    api.get('/admin/club-deshabilitacion'),

  // 🔍 Obtener estado de una deshabilitación
  getEstado: (deshabilitacionId) =>
    api.get(`/admin/club-deshabilitacion/${deshabilitacionId}`),

  // ❌ Cancelar deshabilitación
  cancelar: (deshabilitacionId) =>
    api.delete(`/admin/club-deshabilitacion/${deshabilitacionId}/cancelar`)
};