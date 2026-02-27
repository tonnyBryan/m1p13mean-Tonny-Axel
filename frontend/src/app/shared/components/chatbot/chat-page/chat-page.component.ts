// chat/chat-page/chat-page.component.ts
import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatMessage } from '../../../../core/models/chat.models';
import { ChatStateService } from '../../../services/chat-state.service'; // ← même service que le widget

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
export class ChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef<HTMLDivElement>;
  @ViewChild('inputRef')    inputRef!: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  input = '';
  isLoading = false;
  isLoadingHistory = false;
  showClearConfirm = false;
  suggestedQuestions = SUGGESTED_QUESTIONS;

  private subs = new Subscription();
  private shouldScrollToBottom = false;

  constructor(
      private chatState: ChatStateService,
      private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // S'abonner au même état partagé que le widget
    this.subs.add(
        this.chatState.messages$.subscribe(msgs => {
          this.messages = msgs;
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        })
    );

    this.subs.add(
        this.chatState.isLoading$.subscribe(v => {
          this.isLoading = v;
          this.cdr.detectChanges();
        })
    );

    this.subs.add(
        this.chatState.isLoadingHistory$.subscribe(v => {
          this.isLoadingHistory = v;
          this.cdr.detectChanges();
        })
    );

    // Charge l'historique — ignoré si déjà initialisé (ex: vient du widget)
    // Force reload depuis la DB pour être sûr d'avoir l'état le plus récent
    this.chatState.loadHistory(true);
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get isEmpty(): boolean {
    return this.messages.length === 0 && !this.isLoadingHistory;
  }

  send(text?: string) {
    const msg = (text ?? this.input).trim();
    if (!msg) return;
    this.input = '';
    if (this.inputRef?.nativeElement) this.inputRef.nativeElement.style.height = 'auto';
    this.chatState.send(msg); // ← délègue au service partagé
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
  }

  clearHistory() {
    this.chatState.clearHistory(); // ← vide le BehaviorSubject → widget voit aussi le changement
    this.showClearConfirm = false;
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
}