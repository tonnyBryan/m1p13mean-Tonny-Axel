// chat/chat-page/chat-page.component.ts
import {
  Component, OnInit, ViewChild,
  ElementRef, AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatMessage } from '../../../../core/models/chat.models';
import { ChatService } from '../../../services/chat.service';

const SUGGESTED_QUESTIONS = [
  'How many sales today?',
  'My revenue this month?',
  'Top 5 best-selling products?',
  'Products out of stock?',
  'Sales trend this week?',
  'How many pending orders?',
];

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatMessageComponent],
  templateUrl: './chat-page.component.html',
})
export class ChatPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef<HTMLDivElement>;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  input = '';
  isLoading = false;
  isLoadingHistory = true;
  showClearConfirm = false;
  suggestedQuestions = SUGGESTED_QUESTIONS;
  private shouldScrollToBottom = false;

  constructor(
      private chatService: ChatService,
      private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() { this.loadHistory(); }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get isEmpty(): boolean {
    return this.messages.length === 0 && !this.isLoadingHistory;
  }

  loadHistory() {
    this.isLoadingHistory = true;
    this.chatService.getHistory().subscribe({
      next: (res) => {
        this.messages = res.messages.map(m => ({ ...m }));
        this.isLoadingHistory = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingHistory = false; }
    });
  }

  send(text?: string) {
    const msg = (text ?? this.input).trim();
    if (!msg || this.isLoading) return;

    this.input = '';
    if (this.inputRef?.nativeElement) this.inputRef.nativeElement.style.height = 'auto';
    this.isLoading = true;

    this.messages.push({ role: 'user', content: msg, createdAt: new Date().toISOString() });
    const loadingIndex = this.messages.length;
    this.messages.push({ role: 'assistant', content: '', isLoading: true });
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage(msg).subscribe({
      next: (response) => {
        this.messages[loadingIndex] = {
          role: 'assistant',
          content: response.summary || '',
          structuredResponse: response,
          createdAt: new Date().toISOString(),
          isLoading: false,
        };
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
        this.focusInput();
      },
      error: () => {
        this.messages[loadingIndex] = {
          role: 'assistant',
          content: 'An error occurred. Please try again.',
          structuredResponse: {
            type: 'text', lang: 'en', title: '', summary: '',
            data: { message: 'An error occurred. Please try again.', variant: 'error' },
            actions: []
          },
          isLoading: false,
          createdAt: new Date().toISOString(),
        };
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      }
    });
  }

  clearHistory() {
    this.chatService.clearHistory().subscribe({
      next: () => {
        this.messages = [];
        this.showClearConfirm = false;
        this.cdr.detectChanges();
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch {}
  }

  private focusInput() {
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
  }
}