// chat/chat-message/chat-message.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {ChatKpiComponent} from "../chat-kpi/chat-kpi.component";
import {ChatTableComponent} from "../chat-table/chat-table.component";
import {ChatChartComponent} from "../chat-chart/chat-chart.component";
import {ChatTextComponent} from "../chat-text/chat-text.component";
import {ChatListComponent} from "../chat-list/chat-list.component";
import {
  ChartData,
  ChatMessage,
  KpiData,
  ListData,
  MixedData,
  TableData,
  TextData
} from "../../../../core/models/chat.models";


@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    ChatKpiComponent, ChatTableComponent, ChatChartComponent,
    ChatListComponent, ChatTextComponent,
  ],
  template: `
    <!-- ── USER MESSAGE ── -->
    <div *ngIf="message.role === 'user'" class="flex justify-end">
      <div class="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 shadow-sm">
        <p class="text-sm text-white leading-relaxed">{{ message.content }}</p>
      </div>
    </div>

    <!-- ── ASSISTANT MESSAGE ── -->
    <div *ngIf="message.role === 'assistant'" class="flex gap-2.5">
      <!-- Avatar -->
      <div class="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm mt-0.5">
        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"/>
        </svg>
      </div>

      <div class="flex-1 min-w-0">

        <!-- Loading skeleton -->
        <div *ngIf="message.isLoading" class="flex items-center gap-1.5 py-2">
          <span class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 300ms"></span>
        </div>

        <!-- Structured response -->
        <ng-container *ngIf="!message.isLoading && message.structuredResponse as resp">

          <!-- Title -->
          <p *ngIf="resp.title" class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
            {{ resp.title }}
          </p>

          <!-- Summary -->
          <p *ngIf="resp.summary" class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
            {{ resp.summary }}
          </p>

          <!-- ── Renderers ── -->
          <ng-container [ngSwitch]="resp.type">

            <app-chat-kpi *ngSwitchCase="'kpi'"
              [data]="asKpi(resp.data)">
            </app-chat-kpi>

            <app-chat-table *ngSwitchCase="'table'"
              [data]="asTable(resp.data)">
            </app-chat-table>

            <app-chat-chart *ngSwitchCase="'chart'"
              [data]="asChart(resp.data)">
            </app-chat-chart>

            <app-chat-list *ngSwitchCase="'list'"
              [data]="asList(resp.data)">
            </app-chat-list>

            <app-chat-text *ngSwitchCase="'text'"
              [data]="asText(resp.data)">
            </app-chat-text>

            <!-- Mixed: iterate blocks -->
            <ng-container *ngSwitchCase="'mixed'">
              <ng-container *ngFor="let block of asMixed(resp.data).blocks">
                <app-chat-kpi   *ngIf="block.type === 'kpi'"   [data]="block.data"></app-chat-kpi>
                <app-chat-table *ngIf="block.type === 'table'" [data]="block.data"></app-chat-table>
                <app-chat-chart *ngIf="block.type === 'chart'" [data]="block.data"></app-chat-chart>
                <app-chat-list  *ngIf="block.type === 'list'"  [data]="block.data"></app-chat-list>
                <app-chat-text  *ngIf="block.type === 'text'"  [data]="block.data"></app-chat-text>
              </ng-container>
            </ng-container>

          </ng-container>

          <!-- Action buttons -->
          <div *ngIf="resp.actions?.length" class="flex flex-wrap gap-2 mt-3">
            <a *ngFor="let action of resp.actions"
               [routerLink]="action.route"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              {{ action.label }}
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <!-- Timestamp -->
          <p *ngIf="message.createdAt" class="text-xs text-gray-400 dark:text-gray-600 mt-2">
            {{ message.createdAt | date:'HH:mm' }}
          </p>

        </ng-container>

        <!-- Plain text fallback (no structuredResponse) -->
        <ng-container *ngIf="!message.isLoading && !message.structuredResponse">
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ message.content }}</p>
        </ng-container>

      </div>
    </div>
  `
})
export class ChatMessageComponent {
  @Input() message!: ChatMessage;

  asKpi(d: any): KpiData     { return d as KpiData; }
  asTable(d: any): TableData { return d as TableData; }
  asChart(d: any): ChartData { return d as ChartData; }
  asList(d: any): ListData   { return d as ListData; }
  asText(d: any): TextData   { return d as TextData; }
  asMixed(d: any): MixedData { return d as MixedData; }
}