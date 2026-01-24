import { Injectable, signal } from '@angular/core';
import * as calendarioData from '../../../assets/data/usuarios/MARTIN_ANTONIO_CIRO_CUERVO/calendario.json';
import { CalendarioData, DiaCalendario } from '../models/calendario.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private datosOriginales: CalendarioData = (calendarioData as any).default || calendarioData;

  // Señales públicas requeridas por el componente
  data = signal<CalendarioData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    this.loading.set(true);
    this.error.set(null);
    
    // Simular carga asíncrona para mejor UX
    setTimeout(() => {
      try {
        // Clonar para evitar mutaciones
        const datos = JSON.parse(JSON.stringify(this.datosOriginales));
        
        // Validar estructura básica
        if (!datos || !datos.periodo || !Array.isArray(datos.calendario)) {
          throw new Error('Estructura de datos inválida');
        }
        
        // Completar días faltantes si es necesario
        const datosCompletos = this.completarDiasFaltantes(datos);
        this.data.set(datosCompletos);
        
      } catch (err) {
        console.error('❌ Error al cargar calendario:', err);
        this.error.set(err instanceof Error ? err.message : 'Error al cargar los datos del calendario');
        this.data.set(null);
      } finally {
        this.loading.set(false);
      }
    }, 300); // Pequeño delay para mostrar loading state
  }

  private completarDiasFaltantes(data: CalendarioData): CalendarioData {
    const { dias_totales } = data.periodo;
    const calendarioExistente = new Map<number, DiaCalendario>(
      data.calendario.map(dia => [dia.dia, dia])
    );

    const calendarioCompleto: DiaCalendario[] = [];
    
    for (let diaNum = 1; diaNum <= dias_totales; diaNum++) {
      if (calendarioExistente.has(diaNum)) {
        calendarioCompleto.push(calendarioExistente.get(diaNum)!);
      } else {
        // Crear día faltante con información completa
        calendarioCompleto.push({
          dia: diaNum,
          dia_semana: this.obtenerDiaSemana(data.periodo.mes, diaNum),
          turno: { 
            horario: null, 
            tipo: 'sin_turno', 
            duracion_horas: 0 
          },
          break: { 
            horario: null, 
            duracion_minutos: 0 
          },
          es_dia_libre: true,
          cambios: {
            ha_cambiado: false,
            detalle_cambios: null,
            campos_modificados: [],
            ultima_modificacion: null
          }
        });
      }
    }

    // Recalcular estadísticas basadas en calendario completo
    const diasLibres = calendarioCompleto.filter(d => d.es_dia_libre).length;
    const diasLaborables = dias_totales - diasLibres;

    return { 
      ...data, 
      calendario: calendarioCompleto,
      periodo: {
        ...data.periodo,
        dias_libres: diasLibres,
        dias_laborables: diasLaborables
      }
    };
  }

  private obtenerDiaSemana(mesTexto: string, dia: number): string {
    try {
      const fecha = new Date(mesTexto);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      fecha.setDate(dia);
      return fecha.toLocaleDateString('es-ES', { weekday: 'long' })
        .replace(/^\w/, c => c.toUpperCase());
    } catch {
      // Fallback: calcular basado en mes de enero 2026
      const fechaBase = new Date(2026, 0, 1); // 1 de enero 2026 (jueves)
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      // Calcular el día de la semana para el día dado
      const diaSemana = (fechaBase.getDay() + (dia - 1)) % 7;
      return dias[diaSemana];
    }
  }
}