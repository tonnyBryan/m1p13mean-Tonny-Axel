import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill,
  ApexGrid, ApexMarkers, ApexStroke, ApexTooltip,
  ApexXAxis, ApexYAxis, ApexLegend
} from 'ng-apexcharts';
import { AdminDashboardService } from '../../../../shared/services/admin-dashboard.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DatePickerComponent } from '../../../../shared/components/form/date-picker/date-picker.component';

type PeriodOption = '7d' | '30d' | '6m' | 'custom';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, DatePickerComponent],
  templateUrl: './admin-analytics.component.html',
})
export class AdminAnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('datepicker') datepicker!: ElementRef<HTMLInputElement>;

  isLoading = true;
  selectedPeriod: PeriodOption = '30d';
  salesByDay: any[] = [];

  // Chart config
  public salesSeries: ApexAxisChartSeries = [];
  public salesChart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 280,
    type: 'area',
    toolbar: { show: false },
  };
  public salesColors = ['#F59E0B', '#60A5FA'];
  public salesStroke: ApexStroke = { curve: 'smooth', width: [2, 2] };
  public salesFill: ApexFill = {
    type: 'gradient',
    gradient: { opacityFrom: 0.35, opacityTo: 0 }
  };
  public salesMarkers: ApexMarkers = {
    size: 0, strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 }
  };
  public salesGrid: ApexGrid = {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } }
  };
  public salesDataLabels: ApexDataLabels = { enabled: false };
  public salesTooltip: ApexTooltip = {
    enabled: true,
    y: { formatter: (val) => this.formatNumber(val) }
  };
  public salesXaxis: ApexXAxis = {
    type: 'category',
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
    labels: { style: { fontSize: '12px', colors: '#6B7280' } }
  };
  public salesYaxis: ApexYAxis = {
    labels: {
      style: { fontSize: '12px', colors: ['#6B7280'] },
      formatter: (val) => this.formatNumberShort(val)
    }
  };
  public salesLegend: ApexLegend = { show: false };

  constructor(
      private dashboardService: AdminDashboardService,
      private toast: ToastService
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

  selectPeriod(period: '7d' | '30d' | '6m'): void {
    this.selectedPeriod = period;
    const to = new Date();
    const from = new Date();
    if (period === '7d') from.setDate(from.getDate() - 7);
    if (period === '30d') from.setDate(from.getDate() - 30);
    if (period === '6m') from.setMonth(from.getMonth() - 6);
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
          this.salesByDay = res.data.salesCountByDay || [];
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
    const labels = this.salesByDay.map(d => d.date);
    const directData = this.salesByDay.map(d => d.direct || 0);
    const orderData = this.salesByDay.map(d => d.order || 0);

    this.salesSeries = [
      { name: 'Direct Sales', data: directData },
      { name: 'From Orders', data: orderData },
    ];
    this.salesXaxis = { ...this.salesXaxis, categories: labels };
  }

  get totalSales(): number {
    return this.salesByDay.reduce((sum, d) => sum + (d.total || 0), 0);
  }

  get totalDirect(): number {
    return this.salesByDay.reduce((sum, d) => sum + (d.direct || 0), 0);
  }

  get totalOrder(): number {
    return this.salesByDay.reduce((sum, d) => sum + (d.order || 0), 0);
  }

  getPeriodClass(period: string): string {
    return this.selectedPeriod === period
        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs'
        : 'text-gray-500 dark:text-gray-400';
  }

  formatNumber(val: number): string {
    return new Intl.NumberFormat('fr-MG').format(val || 0);
  }

  formatNumberShort(val: number): string {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'k';
    return (val || 0).toString();
  }
}
