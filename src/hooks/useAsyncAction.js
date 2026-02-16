// src/hooks/useAsyncAction.js
import { useState, useCallback, useRef } from 'react';
import { useGlobalLoading } from '../context/GlobalLoadingContext';

/**
 * Hook para envolver cualquier función async con protección contra multiclicks.
 *
 * CARACTERÍSTICAS:
 * - Deshabilita el botón mientras la acción está en curso (isLoading local)
 * - Registra la acción en el contexto global, bloqueando TODOS los botones del sistema
 * - Ignora clicks adicionales mientras se ejecuta (no dispara la función dos veces)
 *
 * USO BÁSICO:
 *   const [handleAprobar, isAprobing] = useAsyncAction(async () => {
 *     await robotService.aprobar(id);
 *     alert('Aprobado');
 *   });
 *   <button onClick={handleAprobar} disabled={isAprobing}>Aprobar</button>
 *
 * CON PARÁMETROS:
 *   const [asignarModalidad, isAsignando] = useAsyncAction(
 *     async (torneoId, modalidad) => {
 *       await torneoService.asignarModalidad(torneoId, modalidad);
 *     }
 *   );
 *   <button onClick={() => asignarModalidad(torneo.id, 'ELIMINATORIA')} disabled={isAsignando}>
 *
 * OPCIÓN: Ignorar el bloqueo global (para botones de navegación / cerrar modal):
 *   const [cerrar] = useAsyncAction(fn, { global: false });
 *
 * @param {Function} fn - La función async a proteger
 * @param {Object} options
 * @param {boolean} options.global - Si true (default), bloquea el loading global mientras corre
 * @returns {[Function, boolean]} - [wrappedFn, isLoading]
 */
export function useAsyncAction(fn, { global: useGlobal = true } = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  // Ref para evitar llamadas mientras ya está corriendo (más seguro que el state solo)
  const isRunningRef = useRef(false);

  const execute = useCallback(
    async (...args) => {
      // Si ya está corriendo, ignorar el click
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      setIsLoading(true);
      if (useGlobal) startLoading();

      try {
        return await fn(...args);
      } finally {
        isRunningRef.current = false;
        setIsLoading(false);
        if (useGlobal) stopLoading();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, useGlobal, startLoading, stopLoading]
  );

  return [execute, isLoading];
}

/**
 * Versión simplificada: solo bloqueo local (no afecta el sistema global).
 * Útil para botones de navegación entre tabs o cerrar modales.
 *
 * const [fn, loading] = useLocalAction(async () => { ... });
 */
export function useLocalAction(fn) {
  return useAsyncAction(fn, { global: false });
}