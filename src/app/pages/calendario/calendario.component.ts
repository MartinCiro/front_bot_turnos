import { Component, inject, computed, ChangeDetectionStrategy, effect, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarioService } from '../../core/services/calendario.service';
import {
    Calendar,
    Clock,
    Coffee,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    User,
    Download,
    RefreshCw,
    X
} from '../../shared/icons/lucide-icons';

import { DiaCalendario } from '../../core/models/calendario.model';

@Component({
    selector: 'app-calendario',
    standalone: true,
    imports: [CommonModule, DatePipe, LucideAngularModule],
    templateUrl: './calendario.component.html',
    styleUrls: ['./calendario.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class CalendarioComponent {
    private calendarioService = inject(CalendarioService);
    private cdr = inject(ChangeDetectorRef);

    // Señales públicas del servicio
    data = this.calendarioService.data;
    loading = this.calendarioService.loading;
    error = this.calendarioService.error;
    filtroActual = signal<'hoy' | 'semana' | 'mes'>('mes');

    constructor() {
        effect(() => {
            const data = this.data();
            if (data) {

                // Forzar múltiples ciclos de detección
                setTimeout(() => {
                    this.cdr.detectChanges();

                    setTimeout(() => {
                        this.cdr.detectChanges();
                    }, 100);

                    setTimeout(() => {
                        this.cdr.detectChanges();
                    }, 200);
                }, 0);
            }
        });
    }

    // Iconos
    icons = {
        Calendar,
        Clock,
        Coffee,
        AlertCircle,
        CheckCircle,
        ChevronLeft,
        ChevronRight,
        User,
        Download,
        RefreshCw,
        X
    };

    // Días de la semana
    diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Computed: Mes actual basado en los datos
    mesActual = computed(() => {
        const data = this.calendarioService.data();
        return data ? new Date(data.periodo.mes) : new Date();
    });

    mesAnio = computed(() => {
        return this.mesActual().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    });

    // Computed: Días del mes actual
    diasDelMes = computed(() => {
        const data = this.data();
        if (!data) return { dias: [], inicioVacios: 0 };

        const mes = this.mesActual();
        const anio = mes.getFullYear();
        const mesNum = mes.getMonth();
        const primerDia = new Date(anio, mesNum, 1);

        // 👇 Usar dias_totales del JSON
        const diasTotales = data.periodo.dias_totales;
        const dias = Array.from({ length: diasTotales }, (_, i) => i + 1);

        const inicioVacios = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
        return { dias, inicioVacios };
    });

    // En CalendarioComponent
    diasFiltrados = computed(() => {
  const cal = this.calendarioCompleto();
  if (!cal) return { dias: [], inicioVacios: 0 };

  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  switch (this.filtroActual()) {
    case 'hoy':
      // Para "Hoy", creamos un array de 31 posiciones (como el mes)
      // pero solo el día actual tiene valor, el resto son null
      const diasHoy = Array(cal.data.periodo.dias_totales).fill(null);
      diasHoy[diaHoy - 1] = diaHoy; // Índice 0 = día 1
      
      return { dias: diasHoy, inicioVacios: cal.inicioVacios };
      
    case 'semana':
      // Calcular el lunes de la semana actual
      const fechaHoy = new Date(anioActual, mesActual, diaHoy);
      const diaSemanaHoy = fechaHoy.getDay();
      const offset = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy;
      const lunes = new Date(fechaHoy);
      lunes.setDate(fechaHoy.getDate() + offset);
      
      // Crear array del mes completo, pero solo marcar los días de la semana
      const diasSemana = Array(cal.data.periodo.dias_totales).fill(null);
      
      for (let i = 0; i < 7; i++) {
        const fechaDia = new Date(lunes);
        fechaDia.setDate(lunes.getDate() + i);
        
        // Solo incluir si está en el mismo mes
        if (fechaDia.getMonth() === mesActual) {
          const dia = fechaDia.getDate();
          if (dia >= 1 && dia <= cal.data.periodo.dias_totales) {
            diasSemana[dia - 1] = dia;
          }
        }
      }
      
      return { dias: diasSemana, inicioVacios: cal.inicioVacios };
      
    case 'mes':
    default:
      // Convertir array de números a array indexado
      const diasMes = Array(cal.data.periodo.dias_totales).fill(null);
      for (const dia of cal.dias) {
        diasMes[dia - 1] = dia;
      }
      return { dias: diasMes, inicioVacios: cal.inicioVacios };
  }
});

    getArrayVaciosFiltrados(): number[] {
  const diasFiltrados = this.diasFiltrados();
  return Array.from({ length: diasFiltrados.inicioVacios }, (_, i) => i);
}

    calendarioListo = computed(() => {
        return this.data() !== null;
    });

    // Mapa de datos por día
    datosPorDia = computed(() => {
        const data = this.calendarioService.data();
        return data ? new Map(data.calendario.map(d => [d.dia, d])) : new Map();
    });

    hoy(): void {
        this.filtroActual.set('hoy');
    }

    getDiaHoy(): number {
        return new Date().getDate();
    }

    esDiaHoy(dia: number): boolean {
        return dia === this.getDiaHoy();
    }

    getClaseDia(dia: DiaCalendario | undefined, diaNum: number): string {
        if (!dia) {
            return 'min-h-[120px] p-2 flex flex-col bg-white dark:bg-slate-800';
        }

        const base = 'min-h-[120px] p-2 flex flex-col';

        if (dia.es_dia_libre) {
            return `${base} bg-slate-50 dark:bg-slate-900/50`;
        }

        if (dia.cambios.ha_cambiado) {
            return `${base} bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800`;
        }

        return `${base} bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700`;
    }

    getClaseTurno(dia: DiaCalendario): string {
        if (dia.es_dia_libre) {
            return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
        }

        if (dia.cambios.ha_cambiado) {
            return 'bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500';
        }

        return 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500';
    }

    formatearHorario(horario: string | null): string {
        if (!horario) return 'Sin horario';
        return horario.replace(' - ', ' - ');
    }

    getIconoDia(dia: DiaCalendario): string {
        if (dia.es_dia_libre) return 'Coffee';
        if (dia.cambios.ha_cambiado) return 'AlertCircle';
        return 'CheckCircle';
    }

    refrescar(): void {
        this.calendarioService.cargarCalendario();
    }

    getArrayVaciosActual(): number[] {
        const cal = this.calendarioCompleto();
        if (!cal) return [];
        return Array.from({ length: cal.inicioVacios }, (_, i) => i);
    }

    calendarioCompleto = computed(() => {
        const data = this.data();
        if (!data) return null;

        // Calcular días del mes
        const mes = new Date(data.periodo.mes);
        const anio = mes.getFullYear();
        const mesNum = mes.getMonth();
        const primerDia = new Date(anio, mesNum, 1);
        const diasTotales = data.periodo.dias_totales;
        const dias = Array.from({ length: diasTotales }, (_, i) => i + 1);
        const inicioVacios = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

        // Crear mapa de datos por día
        const mapaDatos = new Map<number, DiaCalendario>();
        for (const dia of data.calendario) {
            mapaDatos.set(dia.dia, dia);
        }

        return {
            data,
            dias,
            inicioVacios,
            mapaDatos
        };
    });

    exportar(): void {
        const datos = this.calendarioService.data();
        if (!datos) return;

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendario-${datos.periodo.mes.replace(' ', '-')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    getArrayVacios(): number[] {
        const inicioVacios = this.diasDelMes().inicioVacios;
        return Array.from({ length: inicioVacios }, (_, i) => i);
    }
}