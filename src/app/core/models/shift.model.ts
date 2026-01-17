// Interfaces basadas en el JSON proporcionado
export interface Usuario {
  id: string;
  nombre_completo: string;
}

export interface Periodo {
  mes: string;
  dias_totales: number;
  dias_laborables: number;
  dias_libres: number;
  fecha_generacion: string;
}

export interface TurnoDetalle {
  horario: string | null;
  tipo: string;
  duracion_horas: number;
}

export interface BreakDetalle {
  horario: string | null;
  duracion_minutos: number;
}

export interface CambioHistorial {
  fecha: string;
  cambio: string;
  detalle: {
    antes: DiaCalendarioDetalle;
    despues: DiaCalendarioDetalle;
  };
}

export interface Cambios {
  ha_cambiado: boolean;
  detalle_cambios: string | null;
  campos_modificados: string[];
  ultima_modificacion: string | null;
  historial: CambioHistorial[];
}

export interface DiaCalendarioDetalle {
  turno: TurnoDetalle;
  break: BreakDetalle;
  es_dia_libre: boolean;
}

export interface DiaCalendario {
  dia: number;
  dia_semana: string;
  turno: TurnoDetalle;
  break: BreakDetalle;
  es_dia_libre: boolean;
  cambios: Cambios;
}

export interface Estadisticas {
  total_horas?: number;
  horas_trabajadas?: number;
  dias_trabajados?: number;
}

export interface Metadata {
  version: string;
  ultima_actualizacion: string;
  tiene_cambios_versiones_anteriores: boolean;
  ultima_comparacion: string;
}

export interface ResumenCambios {
  ultima_ejecucion: string;
  total_cambios: number;
  dias_con_cambios: number[];
  dias_eliminados: number[];
  se_detectaron_cambios: boolean;
}

export interface CalendarioData {
  usuario: Usuario;
  periodo: Periodo;
  calendario: DiaCalendario[];
  estadisticas: Estadisticas;
  metadata: Metadata;
  resumen_cambios: ResumenCambios;
}

// Interfaces para el dashboard de turnos
export interface TurnoResumen {
  hoy?: DiaCalendario;  
  proximoTurno?: DiaCalendario; 
  horasSemana: number;
  diasLibresEstaSemana: number;
  cambiosPendientes: number;
}

export interface LeyendaItem {
  color: string;
  titulo: string;
  descripcion: string;
  icono: string;
}

export interface ResumenSemanal {
  horas_totales: number;
  dias_libres: number;
  cambios_pendientes: number;
  dias_con_turno: number;
}