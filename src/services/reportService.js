// src/services/reportService.js
import api from './api';

export const reportService = {
  /**
   * Descarga un reporte en PDF y lo abre en el navegador
   * @param {string} url - URL del endpoint de reporte
   * @param {string} filename - Nombre del archivo a descargar
   */
  downloadPDF: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob' // Importante para recibir archivos binarios
      });

      // Crear un blob desde la respuesta
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Crear URL temporal del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Error descargando reporte:', error);
      throw error;
    }
  },

  // ==================== REPORTES DE TORNEOS ====================
  
  /**
   * Reporte completo de un torneo (PDF)
   * Incluye: Info del torneo, ranking de participantes y enfrentamientos
   */
  descargarReporteTorneo: (torneoId) => {
    return reportService.downloadPDF(
      `/reportes/torneos/${torneoId}/pdf`,
      `torneo_${torneoId}_reporte.pdf`
    );
  },

  /**
   * Reporte de ranking de un torneo (PDF)
   * Solo la tabla de posiciones
   */
  descargarRankingTorneo: (torneoId) => {
    return reportService.downloadPDF(
      `/reportes/torneos/${torneoId}/ranking/pdf`,
      `torneo_${torneoId}_ranking.pdf`
    );
  },

  /**
   * Reporte general de todos los torneos (PDF)
   * Solo para ADMIN
   */
  descargarTodosLosTorneos: () => {
    return reportService.downloadPDF(
      '/reportes/torneos/pdf',
      'todos_los_torneos.pdf'
    );
  },

  // ==================== REPORTES DE CLUBS ====================
  
  /**
   * Estadísticas completas de un club (PDF)
   * Incluye: Miembros, robots, victorias, participantes con efectividad
   */
  descargarReporteClub: (clubId) => {
    return reportService.downloadPDF(
      `/reportes/clubs/${clubId}/pdf`,
      `club_${clubId}_estadisticas.pdf`
    );
  },

  /**
   * Reporte general de todos los clubs (PDF)
   * Solo para ADMIN
   */
  descargarTodosLosClubs: () => {
    return reportService.downloadPDF(
      '/reportes/clubs/pdf',
      'todos_los_clubs.pdf'
    );
  }
};