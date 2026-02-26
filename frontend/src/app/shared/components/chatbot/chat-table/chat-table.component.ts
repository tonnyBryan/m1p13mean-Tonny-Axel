// chat/renderers/chat-table/chat-table.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TableData} from "../../../../core/models/chat.models";

@Component({
  selector: 'app-chat-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-2 overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <table class="w-full text-sm">
        <thead>
        <tr class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
          <th *ngFor="let col of data.columns"
              class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
            {{ col.label }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let row of data.rows; let i = index"
            class="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
          <td *ngFor="let col of data.columns"
              class="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {{ formatValue(row[col.key]) }}
          </td>
        </tr>
        <tr *ngIf="data.rows.length === 0">
          <td [attr.colspan]="data.columns.length"
              class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No data available
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ChatTableComponent {
  @Input() data!: TableData;

  formatValue(val: any): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') return val.toLocaleString('fr-FR');
    return String(val);
  }
}