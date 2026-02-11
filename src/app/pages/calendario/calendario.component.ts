import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarioService } from '../../core/services/calendario.service';
import {
    Calendar,
    Clock,
    Coffee,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    User,
    Download,
    RefreshCw,
    X
} from '../../shared/icons/lucide-icons';
import { DiaCalendario } from '../../core/models/calendario.model';
import { ThemeService } from '@app/core/services/theme';

@Component({
    selector: 'app-calendario',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './calendario.component.html',
    styleUrls: ['./calendario.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarioComponent {
    private service = inject(CalendarioService);
    private themeService = inject(ThemeService);

    // Señales del servicio
    usuarios = this.service.usuarios;
    usuarioActual = this.service.usuarioActual;
    data = this.service.data;
    error = this.service.error;
    mostrarSelectorUsuario = signal(false);

    // Iconos
    icons = {
        Calendar,
        Clock,
        Coffee,
        AlertCircle,
        ChevronLeft,
        ChevronRight,
        User,
        Download,
        RefreshCw,
        X
    };

    isDarkMode = this.themeService.isDarkMode;

    nombreUsuarioColor = computed(() =>
        this.isDarkMode()
            ? 'text-slate-600'
            : 'text-slate-500'
    );

    controlsColors = computed(() =>
        this.isDarkMode()
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-black'
    );

    actionsCalendar = computed(() =>
        this.isDarkMode()
            ? 'hover:bg-slate-600 text-slate-400'
            : 'hover:bg-gray-200 text-slate-600'
    );

    vistaActualColor = computed(() =>
        this.isDarkMode()
            ? 'bg-blue-900/30 text-blue-300'
            : 'bg-gray-200 text-slate-700'
    );

    bgStats = computed(() =>
        this.isDarkMode()
            ? 'bg-slate-900/50'
            : 'bg-gray-200/30'
    );

    bgIconsStats = computed(() =>
        this.isDarkMode()
            ? 'bg-slate-900/50'
            : 'bg-gray-200/30'
    );

    bgColorCalendar = computed(() =>
        this.isDarkMode()
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-slate-200'
    );

    dayCalendarHeader = computed(() =>
        this.isDarkMode()
            ? 'border-slate-700 text-slate-400'
            : 'border-slate-200 text-slate-600'
    );

    dayCalendarClean = computed(() =>
        this.isDarkMode()
            ? 'border-slate-100 bg-slate-50/50'
            : 'border-slate-800'
    );

    dayCalendarReal = computed(() =>
        this.isDarkMode()
            ? 'border-slate-800'
            : 'border-slate-100'
    );

    calendarHeader = computed(() =>
        this.isDarkMode()
            ? 'border-slate-700'
            : 'border-slate-200'
    );

    calendarDayWeek = computed(() =>
        this.isDarkMode()
            ? 'text-slate-400'
            : 'text-slate-600'
    );

    getDiaColor(dia: number, diaData: any): string {
        if (this.esDiaHoy(dia)) return 'text-blue-600 font-bold';
        if (diaData?.es_dia_libre) return 'text-slate-400';
        
        // Para días normales en modo LIGHT (sin dark:)
        return this.isDarkMode() 
            ? 'text-slate-300'  
            : 'text-slate-900';
    }

    borderLegend = computed(() =>
        this.isDarkMode() ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'
    );

    contentLegendNormal = computed(() =>
        this.isDarkMode() ? 'bg-emerald-900/20 text-slate-400' : 'bg-emerald-50 text-slate-600'
    );

    

    // Días de la semana (lunes a domingo)
    diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Vista actual (hoy, semana, mes)
    private vistas: ('hoy' | 'semana' | 'mes')[] = ['hoy', 'semana', 'mes'];
    vistaActual = signal<'hoy' | 'semana' | 'mes'>('mes');

    // Día actual (solo número)
    hoy = computed(() => new Date().getDate());

    // Formateo del mes/año
    mesAnio = computed(() => {
        const data = this.data();
        if (!data) return '';
        const months = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
        } as const;

        const [rawMonth, rawYear] = data.periodo.mes.split(" ");

        const monthName = rawMonth as keyof typeof months;
        const year = Number(rawYear);

        try {
            const mes = new Date(year, months[monthName]);
            return mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                .replace(/^\w/, c => c.toUpperCase());
        } catch {
            return 'Mes desconocido';
        }
    });

    mes() {
        return this.mesAnio().split(' de ')[0];
    }

    formatearHorarioCompacto(horario: string): string {
        // Ejemplo: "08:00-17:00" → "8:00-17:00" o "8-17"
        const [inicio, fin] = horario.split('-');

        // Quita ceros iniciales: "08:00" → "8:00"
        const inicioCompacto = inicio.replace(/^0/, '');
        const finCompacto = fin.replace(/^0/, '');

        // Para móvil podrías incluso quitar los minutos si son :00
        return `${inicioCompacto}-${finCompacto}`;
    }

    // Preprocesa el calendario completo
    calendarioCompleto = computed(() => {
        const data = this.data();
        if (!data) return null;

        try {
            const mes = new Date(data.periodo.mes);
            const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
            const inicioVacios = (primerDia.getDay() - 1 + 7) % 7; // Lunes = 0
            const mapaDatos = new Map<number, DiaCalendario>(
                data.calendario.map(dia => [dia.dia, dia])
            );
            return { data, inicioVacios, mapaDatos };
        } catch (error) {
            console.error('Error procesando calendario:', error);
            return null;
        }
    });

    // Filtra días según la vista
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

    // Métodos de navegación entre vistas
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

    // Genera array de índices para días vacíos (solo en vista 'mes')
    getArrayVacios(): number[] {
        return this.vistaActual() === 'mes'
            ? Array.from({ length: this.diasFiltrados().inicioVacios }, (_, i) => i)
            : [];
    }

    // Manejo de cambio de usuario (tipado)
    onUsuarioChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const usuario = select.value;
        if (usuario) {
            this.service.cambiarUsuario(usuario);
        }
    }

    // Acciones
    exportar(): void {
        const datos = this.data();
        if (!datos) return;
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendario-${this.usuarioActual() || 'usuario'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    refrescar(): void {
        this.service.refrescarUsuarioActual();
    }

    // Utilidades para plantilla
    esDiaHoy(dia: number): boolean {
        return dia === this.hoy();
    }

    getClaseDia(dia?: DiaCalendario) {
  return {
    'bg-slate-50 dark:bg-slate-900/50': !dia || dia.es_dia_libre,
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800': dia?.cambios.ha_cambiado,
  };
}

    getClaseTurno(dia: DiaCalendario): string {
        if (dia.es_dia_libre) return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
        if (dia.cambios.ha_cambiado) return 'bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500';
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500';
    }

    formatearHorario(horario: string | null): string {
        return horario || 'Sin horario';
    }

    formatearNombreUsuario(nombre: string): string {
        return nombre
            .split('_')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');
    }

    // Alternar visibilidad del selector
    toggleSelectorUsuario(): void {
        this.mostrarSelectorUsuario.update(v => !v);
    }

    // Seleccionar usuario y cerrar dropdown
    seleccionarUsuario(usuario: string): void {
        this.service.cambiarUsuario(usuario);
        this.mostrarSelectorUsuario.set(false);
    }
}