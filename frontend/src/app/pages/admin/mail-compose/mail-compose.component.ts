import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupportRequestService } from '../../../shared/services/support-request.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { Subscription } from 'rxjs';
import Quill from 'quill';
import {EmailService} from "../../../shared/services/email.service";

@Component({
  selector: 'app-mail-compose',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mail-compose.component.html',
  styleUrl: './mail-compose.component.css',
})
export class MailComposeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('editorContainer') editorContainer!: ElementRef;

  request: any = null;
  isLoadingRequest = true;

  to = '';
  subject = '';
  body = '';
  isSending = false;
  isDark = false;
  wordCount = 0;

  private quill!: Quill;
  private themeSub!: Subscription;

  isSent = false;
  expandedReplyIndex: number | null = null;


  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private supportService: SupportRequestService,
      private toast: ToastService,
      private themeService: ThemeService,
      private emailService: EmailService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadRequest(id);
    });

    this.themeSub = this.themeService.theme$.subscribe(theme => {
      this.isDark = theme === 'dark';
      this.applyEditorTheme(this.isDark);
    });
  }

  toggleReply(index: number): void {
    this.expandedReplyIndex = this.expandedReplyIndex === index ? null : index;
  }

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  initEditor(): void {
    this.quill = new Quill(this.editorContainer.nativeElement, {
      theme: 'snow',
      placeholder: 'Write your reply here...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['link', 'blockquote'],
          ['clean'],
        ],
      },
    });

    this.quill.on('text-change', () => {
      this.body = this.quill.root.innerHTML;
      const text = this.quill.getText().trim();
      this.wordCount = text ? text.split(/\s+/).filter(w => w).length : 0;
    });

    // Appliquer le thème actuel après init
    this.applyEditorTheme(this.isDark);
  }

  applyEditorTheme(dark: boolean): void {
    if (!this.quill) return;

    const toolbar = this.editorContainer?.nativeElement
        ?.closest('.quill-wrapper')
        ?.querySelector('.ql-toolbar') as HTMLElement;

    const container = this.editorContainer?.nativeElement
        ?.querySelector('.ql-container') as HTMLElement;

    const editor = this.editorContainer?.nativeElement
        ?.querySelector('.ql-editor') as HTMLElement;

    if (dark) {
      this.quill.root.style.color = '#d1d5db';
      this.quill.root.style.backgroundColor = 'transparent';
      if (toolbar) toolbar.style.backgroundColor = 'rgba(255,255,255,0.02)';
      if (toolbar) toolbar.style.borderBottomColor = '#1f2937';
    } else {
      this.quill.root.style.color = '#374151';
      this.quill.root.style.backgroundColor = 'transparent';
      if (toolbar) toolbar.style.backgroundColor = '#f9fafb';
      if (toolbar) toolbar.style.borderBottomColor = '#e5e7eb';
    }
  }

  loadRequest(id: string): void {
    this.supportService.getSupportRequestById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.request = res.data;
          this.to = res.data.email;
          this.subject = `Re: ${res.data.subject}`;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load request.', 0);
          this.router.navigate(['/admin/app/support-requests']);
        }
        this.isLoadingRequest = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load request.', 0);
        this.router.navigate(['/admin/app/support-requests']);
      }
    });
  }

  onSend(): void {
    const text = this.quill.getText().trim();
    if (!text) {
      this.toast.error('Error', 'Message body cannot be empty.', 0);
      return;
    }
    if (!this.subject.trim()) {
      this.toast.error('Error', 'Subject cannot be empty.', 0);
      return;
    }

    this.isSending = true;

    this.emailService.replySupportRequest({
      idSupportRequest: this.request._id,
      to: this.to,
      subject: this.subject,
      text: this.body, // HTML depuis Quill
    }).subscribe({
      next: (res) => {
        if (res.success) {
          if (!this.request.replies) this.request.replies = [];
          this.request.replies.push({
            subject: this.subject,
            text: this.body,
            sentAt: new Date().toISOString(),
          });
          this.request.isAnswered = true;

          this.isSending = false;
          this.isSent = true;
          setTimeout(() => {
            this.router.navigate(['/admin/app/support-requests']);
          }, 3000);
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to send reply.', 0);
        this.isSending = false;
      }
    });
  }

  onDiscard(): void {
    this.router.navigate(['/admin/app/support-requests']);
  }

  onClearEditor(): void {
    this.quill.setContents([]);
    this.body = '';
    this.wordCount = 0;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(date));
  }

  get charCount(): number {
    return this.quill ? this.quill.getText().trim().length : 0;
  }
}