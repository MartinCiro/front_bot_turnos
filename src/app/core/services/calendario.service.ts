import { Injectable, signal } from '@angular/core';
import * as calendarioData from '@assets/data/usuarios/MARTIN_ANTONIO_CIRO_CUERVO/calendario.json';
import { CalendarioData, DiaCalendario } from '../models/calendario.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private datosOriginales: CalendarioData = (calendarioData as any).default || calendarioData;

  data = signal<CalendarioData | null>(null);
  loading = signal(false); // Puedes eliminar esta señal si no usas loading UI
  error = signal<string | null>(null);

  constructor() {
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    this.loading.set(true); // Opcional: si aún quieres mantener coherencia con UI existente
    this.error.set(null);

    try {
      // Clonación ligera (solo profundidad necesaria)
      const datos = structuredClone ? structuredClone(this.datosOriginales) : JSON.parse(JSON.stringify(this.datosOriginales));

      if (!datos?.periodo || !Array.isArray(datos.calendario)) {
        throw new Error('Estructura de datos inválida');
      }

      const datosCompletos = this.completarDiasFaltantes(datos);
      this.data.set(datosCompletos);
    } catch (err) {
      console.error('❌ Error al cargar calendario:', err);
      this.error.set(err instanceof Error ? err.message : 'Error al cargar los datos del calendario');
      this.data.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private completarDiasFaltantes(data: CalendarioData): CalendarioData {
    const { dias_totales, mes } = data.periodo;
    const calendarioExistente = new Map<number, DiaCalendario>(
      data.calendario.map(dia => [dia.dia, dia])
    );

    const calendarioCompleto: DiaCalendario[] = [];

    for (let diaNum = 1; diaNum <= dias_totales; diaNum++) {
      if (calendarioExistente.has(diaNum)) {
        calendarioCompleto.push(calendarioExistente.get(diaNum)!);
      } else {
        calendarioCompleto.push({
          dia: diaNum,
          dia_semana: this.obtenerDiaSemana(mes, diaNum),
          turno: { horario: null, tipo: 'sin_turno', duracion_horas: 0 },
          break: { horario: null, duracion_minutos: 0 },
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
    const fecha = new Date(mesTexto);
    if (isNaN(fecha.getTime())) {
      throw new Error(`Fecha base inválida: ${mesTexto}`);
    }
    fecha.setDate(dia);
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }
}