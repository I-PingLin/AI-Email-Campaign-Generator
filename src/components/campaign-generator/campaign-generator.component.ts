
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { Campaign } from '../../models/campaign.model';

@Component({
  selector: 'app-campaign-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignGeneratorComponent {
  geminiService = inject(GeminiService);

  prompt = signal<string>('A flash sale for a new line of futuristic sneakers.');
  aspectRatio = signal<string>('16:9');
  isLoading = signal<boolean>(false);
  campaign = signal<Campaign | null>(null);
  generatedImage = signal<string | null>(null);

  readonly aspectRatios = [
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Portrait (9:16)' },
  ];
  
  error = this.geminiService.error;

  async generateCampaign(): Promise<void> {
    if (!this.prompt().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.campaign.set(null);
    this.generatedImage.set(null);
    
    const campaignData = await this.geminiService.generateCampaign(this.prompt());

    if (campaignData) {
      this.campaign.set(campaignData);
      const imageData = await this.geminiService.generateImage(campaignData.imagePrompt, this.aspectRatio());
      if(imageData) {
        this.generatedImage.set(imageData);
      }
    }
    
    this.isLoading.set(false);
  }
}
