// chat/renderers/chat-chart/chat-chart.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexChart, ApexAxisChartSeries, ApexNonAxisChartSeries,
  ApexXAxis, ApexYAxis, ApexDataLabels, ApexStroke,
  ApexFill, ApexTooltip, ApexLegend, ApexGrid, ApexPlotOptions
} from 'ng-apexcharts';
import {ChartData} from "../../../../core/models/chat.models";

@Component({
  selector: 'app-chat-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="mt-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
      <apx-chart
        [series]="series"
        [chart]="chartOptions"
        [xaxis]="xaxis"
        [yaxis]="yaxis"
        [dataLabels]="dataLabels"
        [stroke]="stroke"
        [fill]="fill"
        [tooltip]="tooltip"
        [legend]="legend"
        [grid]="grid"
        [plotOptions]="plotOptions"
        [colors]="colors"
        [labels]="labels">
      </apx-chart>
    </div>
  `
})
export class ChatChartComponent implements OnInit {
  @Input() data!: ChartData;

  series: ApexAxisChartSeries | ApexNonAxisChartSeries = [];
  labels: string[] = [];
  chartOptions!: ApexChart;
  xaxis!: ApexXAxis;
  yaxis!: ApexYAxis;
  dataLabels!: ApexDataLabels;
  stroke!: ApexStroke;
  fill!: ApexFill;
  tooltip!: ApexTooltip;
  legend!: ApexLegend;
  grid!: ApexGrid;
  plotOptions!: ApexPlotOptions;
  colors: string[] = ['#465FFF', '#9CB9FF', '#34D399', '#F59E0B', '#EF4444'];

  ngOnInit() {
    const isPie = this.data.chartType === 'pie' || this.data.chartType === 'donut';

    // Series
    if (isPie) {
      this.series = this.data.datasets[0]?.data ?? [];
      this.labels = this.data.labels;
    } else {
      this.series = this.data.datasets.map(ds => ({
        name: ds.label,
        data: ds.data,
      }));
    }

    // Chart base
    this.chartOptions = {
      fontFamily: 'Outfit, sans-serif',
      height: 220,
      type: this.data.chartType === 'area' ? 'area' :
          this.data.chartType === 'line' ? 'line' :
              this.data.chartType === 'donut' ? 'donut' :
                  this.data.chartType === 'pie' ? 'pie' : 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    };

    // X axis (not for pie/donut)
    this.xaxis = isPie ? {} : {
      categories: this.data.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '11px', colors: '#6B7280' }
      }
    };

    // Y axis
    this.yaxis = {
      labels: {
        style: { fontSize: '11px', colors: ['#6B7280'] }
      }
    };

    // Stroke
    this.stroke = {
      curve: 'smooth',
      width: this.data.chartType === 'bar' ? 0 : 2,
    };

    // Fill
    this.fill = this.data.chartType === 'area' ? {
      type: 'gradient',
      gradient: { opacityFrom: 0.45, opacityTo: 0.02 }
    } : { type: 'solid' };

    // DataLabels
    this.dataLabels = {
      enabled: isPie,
      style: { fontSize: '11px' }
    };

    // Tooltip
    this.tooltip = { enabled: true, theme: 'dark' };

    // Legend
    this.legend = {
      show: this.data.datasets.length > 1 || isPie,
      position: 'bottom',
      fontSize: '12px',
    };

    // Grid
    this.grid = {
      borderColor: '#E5E7EB',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    };

    // PlotOptions for bar
    this.plotOptions = {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
      }
    };
  }
}