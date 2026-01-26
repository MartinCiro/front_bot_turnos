// src/app/core/services/calendario.service.ts
import { Injectable, signal } from '@angular/core';
import { CalendarioData, DiaCalendario } from '../models/calendario.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  // Lista de usuarios (cargada desde index.json)
  private usuariosDisponibles: string[] = [];
  private datosPorUsuario = new Map<string, CalendarioData>();

  // Señales públicas
  usuarios = signal<string[]>([]);
  usuarioActual = signal<string | null>(null);
  data = signal<CalendarioData | null>(null);
  error = signal<string | null>(null);

  constructor() {
    this.cargarIndiceUsuarios();
  }

  private async cargarIndiceUsuarios(): Promise<void> {
    try {
      const response = await fetch('/data/usuarios/index.json');
      if (!response.ok) throw new Error('No se encontró index.json');
      this.usuariosDisponibles = await response.json();
      this.usuarios.set(this.usuariosDisponibles);

      // Cargar primer usuario por defecto
      if (this.usuariosDisponibles.length > 0) {
        this.cambiarUsuario(this.usuariosDisponibles[0]);
      }
    } catch (err) {
      console.error('❌ Error al cargar índice de usuarios:', err);
      this.error.set('No se pudieron cargar los usuarios. Verifica /data/usuarios/index.json');
    }
  }

  async cambiarUsuario(nombreUsuario: string): Promise<void> {
    if (!this.usuariosDisponibles.includes(nombreUsuario)) {
      this.error.set(`Usuario "${nombreUsuario}" no encontrado`);
      return;
    }

    this.usuarioActual.set(nombreUsuario);
    this.error.set(null);

    if (this.datosPorUsuario.has(nombreUsuario)) {
      this.data.set(this.datosPorUsuario.get(nombreUsuario)!);
      return;
    }

    try {
      // ✅ Ruta absoluta desde la raíz del sitio
      const response = await fetch(`/data/usuarios/${nombreUsuario}/calendario.json`);
      if (!response.ok) {
        throw new Error(`Archivo no encontrado para ${nombreUsuario} (status ${response.status})`);
      }

      const datosOriginales = await response.json() as CalendarioData;

      if (!datosOriginales?.periodo || !Array.isArray(datosOriginales.calendario)) {
        throw new Error('Estructura de datos inválida');
      }

      const datosCompletos = this.completarDiasFaltantes(datosOriginales);
      this.datosPorUsuario.set(nombreUsuario, datosCompletos);
      this.data.set(datosCompletos);
    } catch (err) {
      console.error(`❌ Error al cargar calendario de ${nombreUsuario}:`, err);
      this.error.set(err instanceof Error ? err.message : 'Error al cargar los datos del usuario');
      this.data.set(null);
    }
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

  refrescarUsuarioActual(): void {
    const usuario = this.usuarioActual();
    if (usuario) {
      this.cambiarUsuario(usuario);
    }
  }
}