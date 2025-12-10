
import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect, viewChild, ElementRef, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat } from '@google/genai';
import { GeminiService } from '../../services/gemini.service';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotComponent implements OnInit {
  geminiService = inject(GeminiService);
  
  chatSession = signal<Chat | null>(null);
  messages = signal<ChatMessage[]>([]);
  currentMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  constructor() {
    effect(() => {
      const container = this.chatContainer();
      if (container) {
        untracked(() => this.scrollToBottom(container.nativeElement));
      }
    });
  }

  ngOnInit(): void {
    this.chatSession.set(this.geminiService.createChatSession());
    this.messages.set([
        { id: '0', role: 'model', text: 'Hello! How can I help you with your marketing today?' }
    ]);
  }

  async sendMessage(): Promise<void> {
    const messageText = this.currentMessage().trim();
    if (!messageText || this.isLoading() || !this.chatSession()) {
      return;
    }

    const userMessage: ChatMessage = { id: this.generateId(), role: 'user', text: messageText };
    this.messages.update(m => [...m, userMessage]);
    this.currentMessage.set('');
    this.isLoading.set(true);

    const modelMessageId = this.generateId();
    this.messages.update(m => [...m, { id: modelMessageId, role: 'model', text: '' }]);

    try {
      const chat = this.chatSession()!;
      const responseStream = await chat.sendMessageStream({ message: messageText });

      for await (const chunk of responseStream) {
        this.messages.update(msgs =>
          msgs.map(msg =>
            msg.id === modelMessageId ? { ...msg, text: msg.text + chunk.text } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.messages.update(msgs =>
        msgs.map(msg =>
          msg.id === modelMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' } : msg
        )
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private scrollToBottom(element: HTMLElement): void {
      setTimeout(() => element.scrollTop = element.scrollHeight, 0);
  }
}
