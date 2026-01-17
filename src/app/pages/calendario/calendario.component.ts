import { Component, inject, computed, ChangeDetectionStrategy, effect, ChangeDetectorRef, NgZone } from '@angular/core';
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

interface Turno {
    horario: string | null;
    tipo: string;
    duracion_horas: number;
}

interface Break {
    horario: string | null;
    duracion_minutos: number;
}

interface Cambios {
    ha_cambiado: boolean;
    detalle_cambios: string | null;
    campos_modificados: string[];
    ultima_modificacion: string | null;
}

interface DiaCalendario {
    dia: number;
    dia_semana: string;
    turno: Turno;
    break: Break;
    es_dia_libre: boolean;
    cambios: Cambios;
}

interface CalendarioData {
    usuario: {
        id: string;
        nombre_completo: string;
    };
    periodo: {
        mes: string;
        dias_totales: number;
        dias_laborables: number;
        dias_libres: number;
        fecha_generacion: string;
    };
    calendario: DiaCalendario[];
    metadata: {
        version: string;
        ultima_actualizacion: string;
    };
}

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

    constructor() {
        effect(() => {
            const data = this.data();
            if (data) {
                console.log('🔄 Datos cargados, forzando renderizado completo...');

                // Forzar múltiples ciclos de detección
                setTimeout(() => {
                    this.cdr.detectChanges();

                    setTimeout(() => {
                        this.cdr.detectChanges();
                    }, 100);

                    setTimeout(() => {
                        this.cdr.detectChanges(); // Tercer ciclo para asegurar
                        console.log('✅ Ciclos de renderizado completados');
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

    calendarioListo = computed(() => {
        return this.data() !== null;
    });

    // Mapa de datos por día
    datosPorDia = computed(() => {
        const data = this.calendarioService.data();
        return data ? new Map(data.calendario.map(d => [d.dia, d])) : new Map();
    });

    hoy(): void {
        const hoy = new Date();
        if (hoy.getFullYear() === 2026 && hoy.getMonth() === 0) {
            console.log('Ya estás en el mes actual del calendario.');
        }
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