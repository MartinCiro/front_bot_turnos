export interface Turno {
  horario: string | null;
  tipo: string;
  duracion_horas: number;
}

export interface Break {
  horario: string | null;
  duracion_minutos: number;
}

export interface Cambios {
  ha_cambiado: boolean;
  detalle_cambios: string | null;
  campos_modificados: string[];
  ultima_modificacion: string | null;
}

export interface DiaCalendario {
  dia: number;
  dia_semana: string;
  turno: Turno;
  break: Break;
  es_dia_libre: boolean;
  cambios: Cambios;
}

export interface CalendarioData {
  usuario: {
    id: string;
    nombre_completo: string;
  };
  periodo: {
    mes: string;
    dias_totales: number;
    dias_laborables: number;
    dias_libres: number;
    fecha_generacion: string;
  };
  calendario: DiaCalendario[];
  metadata: {
    version: string;
    ultima_actualizacion: string;
  };
}