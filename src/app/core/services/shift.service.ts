import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  CalendarioData,
  DiaCalendario,
  LeyendaItem,
  ResumenSemanal,
  TurnoResumen,
  Usuario,
  Periodo,
  Metadata,
  ResumenCambios
} from '../models/shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private readonly DATA_URL = 'assets/data/usuarios/MARTIN_ANTONIO_CIRO_CUERVO/calendario.json';
  
  // Señales para datos reactivos
  private _calendarioData = signal<CalendarioData | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.cargarCalendario();
  }

  /**
   * Carga los datos del calendario desde el archivo JSON
   */
  cargarCalendario(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<CalendarioData>(this.DATA_URL)
      .pipe(
        tap(data => {
          this._calendarioData.set(data);
          console.log('📅 Datos del calendario cargados:', data);
        }),
        catchError(error => {
          console.error('❌ Error al cargar el calendario:', error);
          this._error.set('Error al cargar los datos del calendario');
          return of(null);
        })
      )
      .subscribe(() => {
        this._isLoading.set(false);
      });
  }

  /**
   * Obtiene el día actual del calendario
   */
  getDiaActual(): DiaCalendario | undefined {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const calendario = this._calendarioData()?.calendario;
    
    if (!calendario) return undefined;
    
    return calendario.find(dia => dia.dia === diaActual);
  }

  /**
   * Obtiene el próximo turno programado
   */
  getProximoTurno(): DiaCalendario | undefined {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const calendario = this._calendarioData()?.calendario;
    
    if (!calendario) return undefined;
    
    const turnosFuturos = calendario
      .filter(dia => 
        !dia.es_dia_libre && 
        dia.dia > diaActual && 
        dia.turno.horario !== null
      )
      .sort((a, b) => a.dia - b.dia);
    
    return turnosFuturos.length > 0 ? turnosFuturos[0] : undefined;
  }

  /**
   * Obtiene el resumen semanal
   */
  getResumenSemanal(): ResumenSemanal {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const calendario = this._calendarioData()?.calendario || [];
    
    // Obtener días de la semana actual (lunes a domingo)
    const diasSemana = calendario
      .filter(dia => dia.dia >= diaActual && dia.dia <= diaActual + 6);
    
    const horasTotales = diasSemana
      .filter(dia => !dia.es_dia_libre && dia.turno.horario)
      .reduce((total, dia) => total + dia.turno.duracion_horas, 0);
    
    const diasLibres = diasSemana
      .filter(dia => dia.es_dia_libre)
      .length;
    
    const diasConCambios = diasSemana
      .filter(dia => dia.cambios.ha_cambiado)
      .length;
    
    const diasConTurno = diasSemana
      .filter(dia => !dia.es_dia_libre && dia.turno.horario)
      .length;
    
    return {
      horas_totales: horasTotales,
      dias_libres: diasLibres,
      cambios_pendientes: diasConCambios,
      dias_con_turno: diasConTurno
    };
  }

  /**
   * Obtiene el resumen general de turnos
   */
  getResumenTurnos(): TurnoResumen {
    return {
      hoy: this.getDiaActual() || undefined,
      proximoTurno: this.getProximoTurno() || undefined,
      horasSemana: this.getResumenSemanal().horas_totales,
      diasLibresEstaSemana: this.getResumenSemanal().dias_libres,
      cambiosPendientes: this.getResumenSemanal().cambios_pendientes
    };
  }

  /**
   * Obtiene los elementos de la leyenda para mostrar en la UI
   */
  getLeyendaItems(): LeyendaItem[] {
    return [
      {
        color: 'bg-rose-500',
        titulo: 'Cambio de turno',
        descripcion: 'Horario modificado por supervisor',
        icono: 'warning'
      },
      {
        color: 'bg-emerald-500',
        titulo: 'Completado',
        descripcion: 'Turno ya realizado',
        icono: 'check-circle'
      },
      {
        color: 'bg-slate-300 dark:bg-slate-600',
        titulo: 'Programado',
        descripcion: 'Turno anterior estándar',
        icono: 'calendar'
      },
      {
        color: 'bg-blue-100 dark:bg-blue-900/30',
        titulo: 'Día libre',
        descripcion: 'Sin turno asignado',
        icono: 'coffee'
      }
    ];
  }

  /**
   * Obtiene el tip del día
   */
  getTipDelDia(): string {
    const tips = [
      "Recuerda marcar tu entrada 5 minutos antes para evitar penalizaciones por retraso.",
      "Mantén actualizada tu disponibilidad en el sistema para una mejor planificación.",
      "Revisa los cambios de turno con anticipación para organizar tu día.",
      "Descansa adecuadamente entre turnos para mantener tu rendimiento óptimo.",
      "Comunica cualquier inconveniente con tu supervisor con anticipación."
    ];
    
    // Usar el día del mes para seleccionar un tip (para que cambie cada día)
    const hoy = new Date();
    const diaMes = hoy.getDate();
    const index = (diaMes - 1) % tips.length;
    
    return tips[index];
  }

  /**
   * Obtiene todos los días con cambios
   */
  getDiasConCambios(): DiaCalendario[] {
    return this._calendarioData()?.calendario?.filter(dia => dia.cambios.ha_cambiado) || [];
  }

  /**
   * Filtra días por estado
   */
  filtrarDiasPorEstado(estado: 'todos' | 'laborables' | 'libres' | 'con-cambios'): DiaCalendario[] {
    const calendario = this._calendarioData()?.calendario || [];
    
    switch (estado) {
      case 'laborables':
        return calendario.filter(dia => !dia.es_dia_libre);
      case 'libres':
        return calendario.filter(dia => dia.es_dia_libre);
      case 'con-cambios':
        return calendario.filter(dia => dia.cambios.ha_cambiado);
      default:
        return calendario;
    }
  }

  /**
   * Alternar modo oscuro/claro
   */
  toggleDarkMode(): void {
    const htmlElement = document.documentElement;
    htmlElement.classList.toggle('dark');
  }

  /**
   * Refrescar datos del calendario
   */
  refrescarCalendario(): void {
    this.cargarCalendario();
  }

  // ===============================
  // COMPUTED SIGNALS (SEÑALES COMPUTADAS)
  // ===============================

  /**
   * Señal computada para el usuario
   */
  usuario = computed<Usuario | null>(() => {
    const data = this._calendarioData();
    return data?.usuario || null;
  });

  /**
   * Señal computada para el periodo
   */
  periodo = computed<Periodo | null>(() => {
    const data = this._calendarioData();
    return data?.periodo || null;
  });

  /**
   * Señal computada para el calendario
   */
  calendario = computed<DiaCalendario[]>(() => {
    const data = this._calendarioData();
    return data?.calendario || [];
  });

  /**
   * Señal computada para metadata
   */
  metadata = computed<Metadata | null>(() => {
    const data = this._calendarioData();
    return data?.metadata || null;
  });

  /**
   * Señal computada para resumen de cambios
   */
  resumenCambios = computed<ResumenCambios | null>(() => {
    const data = this._calendarioData();
    return data?.resumen_cambios || null;
  });

  /**
   * Señal computada para estadísticas
   */
  estadisticas = computed(() => {
    const data = this._calendarioData();
    return data?.estadisticas || {};
  });

  // ===============================
  // GETTERS PARA ESTADO DE LA APLICACIÓN
  // ===============================

  get isLoading() {
    return this._isLoading;
  }

  get error() {
    return this._error;
  }

  get data() {
    return this._calendarioData;
  }

  // ===============================
  // MÉTODOS PARA CALCULAR ESTADÍSTICAS
  // ===============================

  /**
   * Calcula horas totales del mes
   */
  getTotalHorasMes(): number {
    const calendario = this.calendario();
    return calendario
      .filter(dia => !dia.es_dia_libre && dia.turno.horario)
      .reduce((total, dia) => total + dia.turno.duracion_horas, 0);
  }

  /**
   * Calcula días libres totales
   */
  getTotalDiasLibres(): number {
    const calendario = this.calendario();
    return calendario.filter(dia => dia.es_dia_libre).length;
  }

  /**
   * Calcula total de cambios
   */
  getTotalCambios(): number {
    const calendario = this.calendario();
    return calendario.filter(dia => dia.cambios.ha_cambiado).length;
  }

  /**
   * Obtiene el día por número
   */
  getDiaPorNumero(numero: number): DiaCalendario | undefined {
    return this.calendario().find(dia => dia.dia === numero);
  }

  /**
   * Verifica si un día es hoy
   */
  esHoy(dia: number): boolean {
    const hoy = new Date();
    return dia === hoy.getDate();
  }

  /**
   * Obtiene el estado de un turno para estilos CSS
   */
  getEstadoTurno(dia: DiaCalendario): string {
    if (dia.es_dia_libre) return 'libre';
    if (dia.cambios.ha_cambiado) return 'modificado';
    return 'programado';
  }

  /**
   * Obtiene clases CSS para un día del calendario
   */
  getClasesDia(dia: DiaCalendario): string {
    const baseClasses = 'min-h-[120px] p-2 flex flex-col group';
    const esHoy = this.esHoy(dia.dia);
    const estado = this.getEstadoTurno(dia);
    
    let classes = baseClasses;
    
    switch (estado) {
      case 'libre':
        classes += ' bg-slate-50 dark:bg-slate-900/50';
        break;
      case 'modificado':
        classes += ' bg-card-light dark:bg-card-dark border-2 border-rose-500/50 bg-rose-50/30 dark:bg-rose-900/10';
        break;
      case 'programado':
        classes += ' bg-card-light dark:bg-card-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
        break;
    }
    
    if (esHoy) {
      classes += ' border-2 border-primary/50 bg-blue-50/30 dark:bg-primary/5';
    }
    
    return classes;
  }

  /**
   * Obtiene clases CSS para un bloque de turno
   */
  getClasesTurno(dia: DiaCalendario): string {
    const estado = this.getEstadoTurno(dia);
    
    switch (estado) {
      case 'modificado':
        return 'bg-rose-100 dark:bg-rose-900/30 border-l-4 border-rose-500';
      case 'programado':
        return 'bg-emerald-100 dark:bg-emerald-900/30 border-l-4 border-emerald-500';
      default:
        return 'bg-slate-100 dark:bg-slate-800/80 border-l-4 border-slate-400';
    }
  }

  /**
   * Obtiene el icono para un estado de turno
   */
  getIconoEstado(dia: DiaCalendario): string {
    const estado = this.getEstadoTurno(dia);
    
    switch (estado) {
      case 'modificado':
        return 'alert-circle';
      case 'programado':
        return 'check-circle';
      case 'libre':
        return 'coffee';
      default:
        return 'clock';
    }
  }

  /**
   * Formatea un horario para mostrar
   */
  formatHorario(horario: string | null): string {
    if (!horario) return 'Sin horario';
    return horario.replace(' - ', ' a ');
  }
}