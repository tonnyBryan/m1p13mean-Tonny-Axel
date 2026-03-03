import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-widget',
  template: `
    <div
      class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8 shadow-md dark:from-white/[0.05] dark:to-indigo-950/[0.1]"
    > 
      <div class="space-y-4">
        <!-- Developer 1 -->
        <div class="rounded-lg bg-white/60 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.08] border border-blue-100 dark:border-indigo-500/20 hover:shadow-md transition-shadow">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            2768
          </p>
          <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">
            ANDERSON Tonny Bryan
          </p>
        </div>
        
        <!-- Developer 2 -->
        <div class="rounded-lg bg-white/60 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.08] border border-blue-100 dark:border-indigo-500/20 hover:shadow-md transition-shadow">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            2442
          </p>
          <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">
            MAMIRAZANA Isis Axel
          </p>
        </div>
      </div>
    </div>
  `
})
export class SidebarWidgetComponent {} 