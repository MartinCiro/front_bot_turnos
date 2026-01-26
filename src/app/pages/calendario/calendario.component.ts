import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { DiaCalendario, CalendarioData } from '../../core/models/calendario.model';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarioComponent {
  private calendarioService = inject(CalendarioService);

  // Datos del servicio (síncronos)
  data = this.calendarioService.data;

  // Vistas cíclicas
  private vistas: ('hoy' | 'semana' | 'mes')[] = ['hoy', 'semana', 'mes'];
  vistaActual = signal<'hoy' | 'semana' | 'mes'>('mes');

  // Iconos usados en la plantilla
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

  // Días de la semana (lunes a domingo)
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Día actual (solo número)
  hoy = computed(() => new Date().getDate());

  // Mes base del calendario
  mesActual = computed(() => {
    const data = this.data();
    if (!data) return new Date();
    try {
      return new Date(data.periodo.mes);
    } catch {
      return new Date();
    }
  });

  mesAnio = computed(() => {
    const mes = this.mesActual();
    return mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase());
  });

  // Preprocesa el calendario completo (una sola vez)
  calendarioCompleto = computed(() => {
    const data = this.data();
    if (!data) return null;

    try {
      const mes = new Date(data.periodo.mes);
      const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
      // Ajuste para que la semana empiece en lunes (0 = lun, ..., 6 = dom)
      const inicioVacios = (primerDia.getDay() - 1 + 7) % 7;
      const mapaDatos = new Map<number, DiaCalendario>(
        data.calendario.map(dia => [dia.dia, dia])
      );

      return { data, inicioVacios, mapaDatos };
    } catch (error) {
      console.error('Error procesando calendario:', error);
      return null;
    }
  });

  // Filtra días según la vista actual
  diasFiltrados = computed(() => {
    const cal = this.calendarioCompleto();
    if (!cal) return { dias: [] as number[], inicioVacios: 0 };

    const totalDias = cal.data.periodo.dias_totales;
    const hoyNum = this.hoy();

    switch (this.vistaActual()) {
      case 'hoy':
        return {
          dias: hoyNum >= 1 && hoyNum <= totalDias ? [hoyNum] : [],
          inicioVacios: 0
        };

      case 'semana': {
        const fechaHoy = new Date();
        const diaSemana = fechaHoy.getDay(); // 0 = dom, 1 = lun, ..., 6 = sáb
        const offset = diaSemana === 0 ? -6 : 1 - diaSemana; // Lunes de la semana
        const lunes = new Date(fechaHoy);
        lunes.setDate(fechaHoy.getDate() + offset);

        const diasSemana: number[] = [];
        for (let i = 0; i < 7; i++) {
          const fechaDia = new Date(lunes);
          fechaDia.setDate(lunes.getDate() + i);
          // Solo incluir si es el mismo mes calendario (no cruzar meses)
          if (fechaDia.getMonth() === fechaHoy.getMonth()) {
            const dia = fechaDia.getDate();
            if (dia >= 1 && dia <= totalDias) {
              diasSemana.push(dia);
            }
          }
        }
        return { dias: diasSemana, inicioVacios: 0 };
      }

      case 'mes':
      default:
        return {
          dias: Array.from({ length: totalDias }, (_, i) => i + 1),
          inicioVacios: cal.inicioVacios
        };
    }
  });

  // Utilidad para generar array de índices (solo usado en vista 'mes')
  getArrayVacios(): number[] {
    return this.vistaActual() === 'mes'
      ? Array.from({ length: this.diasFiltrados().inicioVacios }, (_, i) => i)
      : [];
  }

  // Navegación entre vistas
  retrocederVista(): void {
    const idx = this.vistas.indexOf(this.vistaActual());
    const nuevoIdx = (idx - 1 + this.vistas.length) % this.vistas.length;
    this.vistaActual.set(this.vistas[nuevoIdx]);
  }

  avanzarVista(): void {
    const idx = this.vistas.indexOf(this.vistaActual());
    const nuevoIdx = (idx + 1) % this.vistas.length;
    this.vistaActual.set(this.vistas[nuevoIdx]);
  }

  getNombreVistaActual(): string {
    const nombres = { hoy: 'Hoy', semana: 'Semana', mes: 'Mes' };
    return nombres[this.vistaActual()];
  }

  esDiaHoy(dia: number): boolean {
    return dia === this.hoy();
  }

  getClaseDia(dia: DiaCalendario | undefined, diaNum: number): string {
    const base = 'min-h-[140px] p-2 flex flex-col border border-slate-100 dark:border-slate-800';
    if (!dia) return `${base} bg-slate-50 dark:bg-slate-900/50`;

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
    return horario || 'Sin horario';
  }

  refrescar(): void {
    this.calendarioService.cargarCalendario();
  }

  exportar(): void {
    const datos = this.data();
    if (!datos) return;

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-${datos.periodo.mes.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}