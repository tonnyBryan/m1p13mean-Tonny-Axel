// chat/chat-widget/chat-widget.component.ts
import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatMessage } from '../../../../core/models/chat.models';
import {ChatStateService} from "../../../services/chat-state.service";

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatMessageComponent],
  templateUrl: './chat-widget.component.html',
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('widgetInput') widgetInput!: ElementRef<HTMLTextAreaElement>;

  isOpen = false;
  isOnChatPage = false;
  messages: ChatMessage[] = [];
  isLoading = false;
  input = '';

  private subs = new Subscription();
  private shouldScrollToBottom = false;

  constructor(
      public  chatState: ChatStateService,
      private router: Router,
      private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Check current route
    this.checkRoute(this.router.url);

    // Watch route changes
    this.subs.add(
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
          this.checkRoute(e.urlAfterRedirects || e.url);
          // If user navigated to chat page while widget was open → close widget
          if (this.isOnChatPage) this.isOpen = false;
        })
    );

    // Subscribe to shared state
    this.subs.add(
        this.chatState.messages$.subscribe(msgs => {
          this.messages = msgs;
          if (this.isOpen) this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        })
    );

    this.subs.add(
        this.chatState.isLoading$.subscribe(v => {
          this.isLoading = v;
          this.cdr.detectChanges();
        })
    );

    // Pre-load history so widget is ready instantly when opened
    this.chatState.loadHistory();
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && this.isOpen) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private checkRoute(url: string) {
    this.isOnChatPage = url.includes('/store/app/chat');
    this.cdr.detectChanges();
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScrollToBottom = true;
      setTimeout(() => this.widgetInput?.nativeElement?.focus(), 150);
    }
  }

  close() { this.isOpen = false; }

  send() {
    const msg = this.input.trim();
    if (!msg) return;
    this.input = '';
    if (this.widgetInput?.nativeElement) this.widgetInput.nativeElement.style.height = 'auto';
    this.chatState.send(msg);
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
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}