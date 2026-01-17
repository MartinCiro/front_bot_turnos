// src/app/core/services/calendario.service.ts
import { Injectable, signal } from '@angular/core';
import * as calendarioData from '../../../assets/data/usuarios/MARTIN_ANTONIO_CIRO_CUERVO/calendario.json';
import { CalendarioData } from '../models/calendario.model';

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
    try {
      // Clonar para evitar mutaciones
      const datos = JSON.parse(JSON.stringify(this.datosOriginales));
      // Completar días faltantes si es necesario
      const datosCompletos = this.completarDiasFaltantes(datos);
      this.data.set(datosCompletos);
      this.error.set(null);
    } catch (err) {
      console.error('❌ Error al cargar calendario:', err);
      this.error.set('Error al cargar los datos del calendario');
    } finally {
      this.loading.set(false);
    }
  }

  private completarDiasFaltantes(data: CalendarioData): CalendarioData {
    const { dias_totales } = data.periodo;
    const calendarioExistente = new Map<number, any>(
      data.calendario.map((dia: any) => [dia.dia, dia])
    );

    const calendarioCompleto: any[] = [];
    
    for (let diaNum = 1; diaNum <= dias_totales; diaNum++) {
      if (calendarioExistente.has(diaNum)) {
        calendarioCompleto.push(calendarioExistente.get(diaNum));
      } else {
        // Crear día faltante
        calendarioCompleto.push({
          dia: diaNum,
          dia_semana: this.obtenerDiaSemana(data.periodo.mes, diaNum),
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

    return { ...data, calendario: calendarioCompleto };
  }

  private obtenerDiaSemana(mesTexto: string, dia: number): string {
    try {
      const fecha = new Date(mesTexto);
      fecha.setDate(dia);
      return fecha.toLocaleDateString('es-ES', { weekday: 'long' })
        .replace(/^\w/, c => c.toUpperCase());
    } catch {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      // Cálculo aproximado (solo para enero 2026)
      const primerDiaEnero2026 = 4; // Jueves = 4 (0=Domingo)
      const diaSemana = (primerDiaEnero2026 + dia - 1) % 7;
      return dias[diaSemana];
    }
  }
}