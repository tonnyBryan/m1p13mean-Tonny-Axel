// chat/chat.models.ts

// ── Raw API response types ────────────────────────────────────────────────────

export type ChatResponseType = 'kpi' | 'table' | 'chart' | 'list' | 'text' | 'mixed';
export type ChatLang = 'fr' | 'en';
export type ChatVariant = 'info' | 'success' | 'warning' | 'error';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area';

// KPI
export interface KpiItem {
    label: string;
    value: number | string;
    unit?: string;
    trend?: string;
    trendDirection?: TrendDirection;
}
export interface KpiData { items: KpiItem[]; }

// Table
export interface TableColumn { key: string; label: string; }
export interface TableData { columns: TableColumn[]; rows: Record<string, any>[]; }

// Chart
export interface ChartDataset { label: string; data: number[]; }
export interface ChartData { chartType: ChartType; labels: string[]; datasets: ChartDataset[]; }

// List
export type BadgeColor = 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'indigo';
export interface ListItem { id?: string; label: string; sublabel?: string; badge?: string; badgeColor?: BadgeColor; }
export interface ListData { items: ListItem[]; }

// Text
export interface TextData { message: string; variant: ChatVariant; }

// Mixed
export interface MixedBlock { type: Exclude<ChatResponseType, 'mixed'>; data: any; }
export interface MixedData { blocks: MixedBlock[]; }

// Action button
export interface ChatAction { label: string; route: string; }

// ── Main response ─────────────────────────────────────────────────────────────

export interface ChatResponse {
    type: ChatResponseType;
    lang: ChatLang;
    title: string;
    summary: string;
    data: KpiData | TableData | ChartData | ListData | TextData | MixedData;
    actions: ChatAction[];
}

// ── Session / history ─────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    structuredResponse?: ChatResponse | null;
    createdAt?: string;
    // UI state
    isLoading?: boolean;
}

export interface ChatHistoryResponse {
    messages: ChatMessage[];
}