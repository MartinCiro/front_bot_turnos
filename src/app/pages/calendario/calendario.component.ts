import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
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

import { DiaCalendario, CalendarioData } from '../../core/models/calendario.model';

interface FiltroCalendario {
    tipo: 'hoy' | 'semana' | 'mes';
    nombre: string;
}

interface CalendarioCompleto {
    data: CalendarioData;
    dias: number[];
    inicioVacios: number;
    mapaDatos: Map<number, DiaCalendario>;
}

@Component({
    selector: 'app-calendario',
    standalone: true,
    imports: [CommonModule, DatePipe, LucideAngularModule],
    templateUrl: './calendario.component.html',
    styleUrls: ['./calendario.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarioComponent {
    private calendarioService = inject(CalendarioService);

    // Señales públicas del servicio
    data = this.calendarioService.data;
    loading = this.calendarioService.loading;
    error = this.calendarioService.error;
    filtroActual = signal<'hoy' | 'semana' | 'mes'>('mes');

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

    // Señal para la fecha actual
    fechaActual = signal(new Date());

    // Computed: Mes actual basado en los datos
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
        return mes.toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        }).replace(/^\w/, c => c.toUpperCase());
    });

    // Computed: Calendario completo procesado
    calendarioCompleto = computed(() => {
        const data = this.data();
        if (!data) return null;

        try {
            const mes = new Date(data.periodo.mes);
            const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
            const diasTotales = data.periodo.dias_totales;
            
            // Calcular días vacíos al inicio (offset para que empiece en Lunes)
            let inicioVacios = primerDia.getDay() - 1; // 0=Domingo, 1=Lunes...
            if (inicioVacios < 0) inicioVacios = 6; // Si es domingo (0), ajustar a 6 vacíos
            
            const dias = Array.from({ length: diasTotales }, (_, i) => i + 1);

            // Crear mapa de datos por día
            const mapaDatos = new Map<number, DiaCalendario>();
            for (const dia of data.calendario) {
                mapaDatos.set(dia.dia, dia);
            }

            return { data, dias, inicioVacios, mapaDatos };
        } catch (error) {
            console.error('Error procesando calendario:', error);
            return null;
        }
    });

    // Computed: Días filtrados según vista actual
    diasFiltrados = computed(() => {
        const cal = this.calendarioCompleto();
        if (!cal) return { dias: [], inicioVacios: 0 };

        const hoy = this.fechaActual();
        const diaHoy = hoy.getDate();
        const mesActualCal = hoy.getMonth();
        const anioActual = hoy.getFullYear();

        switch (this.filtroActual()) {
            case 'hoy':
                return this.filtrarHoy(cal, diaHoy);
            case 'semana':
                return this.filtrarSemana(cal, diaHoy, mesActualCal, anioActual);
            case 'mes':
            default:
                return this.filtrarMes(cal);
        }
    });

    calendarioListo = computed(() => {
        return this.data() !== null;
    });

    // Métodos privados de filtrado
    private filtrarHoy(cal: CalendarioCompleto, diaHoy: number) {
        const dias = Array(cal.data.periodo.dias_totales).fill(null);
        if (diaHoy >= 1 && diaHoy <= cal.data.periodo.dias_totales) {
            dias[diaHoy - 1] = diaHoy;
        }
        return { dias, inicioVacios: cal.inicioVacios };
    }

    private filtrarSemana(cal: CalendarioCompleto, diaHoy: number, mes: number, anio: number) {
        const dias = Array(cal.data.periodo.dias_totales).fill(null);
        const fechaHoy = new Date(anio, mes, diaHoy);
        const diaSemanaHoy = fechaHoy.getDay();
        const offset = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy; // Lunes como inicio de semana
        const lunes = new Date(fechaHoy);
        lunes.setDate(fechaHoy.getDate() + offset);
        
        // Asegurarnos de que estamos en el mes correcto del calendario
        const mesCalendario = new Date(cal.data.periodo.mes).getMonth();
        
        for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(lunes);
            fechaDia.setDate(lunes.getDate() + i);
            
            // Solo incluir si está en el mismo mes que el calendario
            if (fechaDia.getMonth() === mesCalendario) {
                const dia = fechaDia.getDate();
                if (dia >= 1 && dia <= cal.data.periodo.dias_totales) {
                    dias[dia - 1] = dia;
                }
            }
        }
        
        return { dias, inicioVacios: cal.inicioVacios };
    }

    private filtrarMes(cal: CalendarioCompleto) {
        const dias = Array(cal.data.periodo.dias_totales).fill(null);
        for (const dia of cal.dias) {
            dias[dia - 1] = dia;
        }
        return { dias, inicioVacios: cal.inicioVacios };
    }

    // Método de utilidad para crear arrays de vacíos
    private crearArrayVacios(cantidad: number): number[] {
        return Array.from({ length: cantidad }, (_, i) => i);
    }

    // Métodos públicos
    getArrayVaciosActual(): number[] {
        const cal = this.calendarioCompleto();
        return cal ? this.crearArrayVacios(cal.inicioVacios) : [];
    }

    getArrayVaciosFiltrados(): number[] {
        const diasFiltrados = this.diasFiltrados();
        return this.crearArrayVacios(diasFiltrados.inicioVacios);
    }

    // Método para activar el filtro "hoy"
    irAHoy(): void {
        this.filtroActual.set('hoy');
        this.fechaActual.set(new Date());
    }

    getDiaHoy(): number {
        return this.fechaActual().getDate();
    }

    esDiaHoy(dia: number): boolean {
        // Solo considerar el mismo día si también es el mismo mes/año
        const hoy = this.fechaActual();
        const mesCalendario = this.mesActual();
        
        return dia === hoy.getDate() && 
               hoy.getMonth() === mesCalendario.getMonth() && 
               hoy.getFullYear() === mesCalendario.getFullYear();
    }

    getClaseDia(dia: DiaCalendario | undefined, diaNum: number): string {
        const base = 'min-h-[140px] p-2 flex flex-col';
        
        if (!dia) {
            if (this.diasFiltrados().dias[diaNum - 1] === null) {
                return `${base} border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50`;
            }
            return `${base} border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800`;
        }
        
        if (dia.es_dia_libre) return `${base} border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50`;
        if (dia.cambios.ha_cambiado) return `${base} border border-slate-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-900/20`;
        
        return `${base} border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700`;
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
        return horario;
    }

    /* getIconoDia(dia: DiaCalendario): string {
        if (dia.es_dia_libre) return 'Coffee';
        if (dia.cambios.ha_cambiado) return 'AlertCircle';
        return 'CheckCircle';
    } */

    refrescar(): void {
        this.calendarioService.cargarCalendario();
        this.fechaActual.set(new Date());
    }

    exportar(): void {
        const datos = this.data();
        if (!datos) return;

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendario-${datos.periodo.mes.replace(' ', '-')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Para compatibilidad con template original
    getArrayVacios(): number[] {
        const inicioVacios = this.diasFiltrados().inicioVacios;
        return this.crearArrayVacios(inicioVacios);
    }
}