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
    
    // Opciones de vista en orden cíclico
    private vistas: ('hoy' | 'semana' | 'mes')[] = ['hoy', 'semana', 'mes'];
    vistaActual = signal<'hoy' | 'semana' | 'mes'>('mes');

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

        switch (this.vistaActual()) {
            case 'hoy':
                return this.filtrarHoy(cal, diaHoy);
            case 'semana':
                return this.filtrarSemana(cal, diaHoy, mesActualCal, anioActual);
            case 'mes':
            default:
                return this.filtrarMes(cal);
        }
    });

    // Métodos privados de filtrado
    private filtrarHoy(cal: any, diaHoy: number) {
        const dias = Array(cal.data.periodo.dias_totales).fill(null);
        if (diaHoy >= 1 && diaHoy <= cal.data.periodo.dias_totales) {
            dias[diaHoy - 1] = diaHoy;
        }
        return { dias, inicioVacios: cal.inicioVacios };
    }

    private filtrarSemana(cal: any, diaHoy: number, mes: number, anio: number) {
        const dias = Array(cal.data.periodo.dias_totales).fill(null);
        const fechaHoy = new Date(anio, mes, diaHoy);
        const diaSemanaHoy = fechaHoy.getDay();
        const offset = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy;
        const lunes = new Date(fechaHoy);
        lunes.setDate(fechaHoy.getDate() + offset);
        
        for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(lunes);
            fechaDia.setDate(lunes.getDate() + i);
            
            if (fechaDia.getMonth() === mes) {
                const dia = fechaDia.getDate();
                if (dia >= 1 && dia <= cal.data.periodo.dias_totales) {
                    dias[dia - 1] = dia;
                }
            }
        }
        
        return { dias, inicioVacios: cal.inicioVacios };
    }

    private filtrarMes(cal: any) {
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
    getArrayVaciosFiltrados(): number[] {
        const diasFiltrados = this.diasFiltrados();
        return this.crearArrayVacios(diasFiltrados.inicioVacios);
    }

    // Navegación entre vistas con flechas
    retrocederVista(): void {
        const indiceActual = this.vistas.indexOf(this.vistaActual());
        const nuevoIndice = (indiceActual - 1 + this.vistas.length) % this.vistas.length;
        this.vistaActual.set(this.vistas[nuevoIndice]);
        
        // Si cambiamos a "hoy", actualizar la fecha
        if (this.vistas[nuevoIndice] === 'hoy') {
            this.fechaActual.set(new Date());
        }
    }

    avanzarVista(): void {
        const indiceActual = this.vistas.indexOf(this.vistaActual());
        const nuevoIndice = (indiceActual + 1) % this.vistas.length;
        this.vistaActual.set(this.vistas[nuevoIndice]);
        
        // Si cambiamos a "hoy", actualizar la fecha
        if (this.vistas[nuevoIndice] === 'hoy') {
            this.fechaActual.set(new Date());
        }
    }

    // Para obtener el nombre legible de la vista
    getNombreVistaActual(): string {
        const nombres = {
            'hoy': 'Hoy',
            'semana': 'Semana',
            'mes': 'Mes'
        };
        return nombres[this.vistaActual()];
    }

    getDiaHoy(): number {
        return this.fechaActual().getDate();
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

    

    refrescar(): void {
        this.calendarioService.cargarCalendario();
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

    getArrayVacios(): number[] {
        const inicioVacios = this.diasFiltrados().inicioVacios;
        return this.crearArrayVacios(inicioVacios);
    }
}