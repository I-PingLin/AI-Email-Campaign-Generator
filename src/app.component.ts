
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignGeneratorComponent } from './components/campaign-generator/campaign-generator.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

type Tab = 'generator' | 'chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CampaignGeneratorComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  activeTab = signal<Tab>('generator');

  selectTab(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
