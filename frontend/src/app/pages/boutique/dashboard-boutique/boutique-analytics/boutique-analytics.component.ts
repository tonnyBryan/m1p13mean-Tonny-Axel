import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill,
  ApexGrid, ApexLegend, ApexMarkers, ApexStroke, ApexTooltip,
  ApexXAxis, ApexYAxis, ApexPlotOptions
} from 'ng-apexcharts';
import { BoutiqueDashboardService } from '../../../../shared/services/boutique-dashboard.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {DatePickerComponent} from "../../../../shared/components/form/date-picker/date-picker.component";
import {Router} from "@angular/router";

type PeriodOption = '7d' | '30d' | '3m' | 'custom';

@Component({
  selector: 'app-boutique-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, DatePickerComponent],
  templateUrl: './boutique-analytics.component.html',
})
export class BoutiqueAnalyticsComponent implements OnInit, AfterViewInit {

  @ViewChild('datepicker') datepicker!: ElementRef<HTMLInputElement>;

  isLoading = true;
  selectedPeriod: PeriodOption = '30d';

  caByDay: any[] = [];
  commandes = { success: 0, canceled: 0 };
  topProducts: any[] = [];
  current: any = null;
  previous: any = null;

  // ── CA Chart
  public caSeries: ApexAxisChartSeries = [];
  public caChart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 280,
    type: 'area',
    toolbar: { show: false },
  };
  public caColors = ['#465FFF', '#9CB9FF'];
  public caStroke: ApexStroke = { curve: 'smooth', width: [2, 2] };
  public caFill: ApexFill = {
    type: 'gradient',
    gradient: { opacityFrom: 0.45, opacityTo: 0 }
  };
  public caMarkers: ApexMarkers = {
    size: 0, strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 }
  };
  public caGrid: ApexGrid = {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } }
  };
  public caDataLabels: ApexDataLabels = { enabled: false };
  public caTooltip: ApexTooltip = {
    enabled: true,
    y: { formatter: (val) => this.formatPrice(val) }
  };
  public caXaxis: ApexXAxis = {
    type: 'category',
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
    labels: { style: { fontSize: '12px', colors: '#6B7280' } }
  };
  public caYaxis: ApexYAxis = {
    labels: {
      style: { fontSize: '12px', colors: ['#6B7280'] },
      formatter: (val) => this.formatPriceShort(val)
    }
  };
  public caLegend: ApexLegend = { show: false };

  // ── Commandes Chart
  public cmdSeries: ApexAxisChartSeries = [];
  public cmdChart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 200,
    type: 'bar',
    toolbar: { show: false },
    stacked: false,
  };
  public cmdColors = ['#10B981', '#F43F5E'];
  public cmdPlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '30%', borderRadius: 4 }
  };
  public cmdDataLabels: ApexDataLabels = { enabled: false };
  public cmdXaxis: ApexXAxis = {
    categories: ['Success', 'Canceled'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '12px', colors: '#6B7280' } }
  };
  public cmdYaxis: ApexYAxis = {
    labels: { style: { fontSize: '12px', colors: ['#6B7280'] } }
  };
  public cmdGrid: ApexGrid = {
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } }
  };

  constructor(
      private dashboardService: BoutiqueDashboardService,
      private toast: ToastService,
      protected router : Router
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    flatpickr(this.datepicker.nativeElement, {
      mode: 'range',
      static: true,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d',
      onReady: (_: Date[], dateStr: string, instance: Instance) => {
        (instance.element as HTMLInputElement).value = dateStr.replace('to', '-');
        const customClass = instance.element.getAttribute('data-class');
        instance.calendarContainer?.classList.add(customClass!);
      },
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length === 2) {
          this.selectedPeriod = 'custom';
          const from = selectedDates[0].toISOString().split('T')[0];
          const to = selectedDates[1].toISOString().split('T')[0];
          this.loadAnalytics(from, to);
        }
      },
    });
  }

  selectPeriod(period: '7d' | '30d' | '3m'): void {
    this.selectedPeriod = period;
    const to = new Date();
    const from = new Date();
    if (period === '7d') from.setDate(from.getDate() - 7);
    if (period === '30d') from.setDate(from.getDate() - 30);
    if (period === '3m') from.setMonth(from.getMonth() - 3);
    this.loadAnalytics(
        from.toISOString().split('T')[0],
        to.toISOString().split('T')[0]
    );
  }

  loadAnalytics(from?: string, to?: string): void {
    this.isLoading = true;
    this.dashboardService.getAnalytics(from, to).subscribe({
      next: (res) => {
        if (res.success) {
          this.caByDay = res.data.caByDay;
          this.commandes = res.data.commandes;
          this.topProducts = res.data.topProducts;
          this.current = res.data.current;
          this.previous = res.data.previous;
          this.buildCharts();
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load analytics.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load analytics.', 0);
        this.isLoading = false;
      }
    });
  }

  buildCharts(): void {
    const labels = this.caByDay.map(d => d.date);
    const directData = this.caByDay.map(d => d.direct);
    const orderData = this.caByDay.map(d => d.fromOrder);

    this.caSeries = [
      { name: 'Direct Sales', data: directData },
      { name: 'From Orders', data: orderData },
    ];
    this.caXaxis = { ...this.caXaxis, categories: labels };

    this.cmdSeries = [
      { name: 'Success', data: [this.commandes.success, 0] },
      { name: 'Canceled', data: [0, this.commandes.canceled] }
    ];
  }

  getVariation(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
    const diff = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(diff)),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    };
  }

  getPeriodClass(period: string): string {
    return this.selectedPeriod === period
        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs'
        : 'text-gray-500 dark:text-gray-400';
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('fr-MG').format(val) + ' Ar';
  }

  formatPriceShort(val: number): string {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'k';
    return val.toString();
  }

  get totalCA(): number {
    return this.caByDay.reduce((sum, d) => sum + d.total, 0);
  }

  get totalDirect(): number {
    return this.caByDay.reduce((sum, d) => sum + d.direct, 0);
  }

  get totalFromOrder(): number {
    return this.caByDay.reduce((sum, d) => sum + d.fromOrder, 0);
  }
}