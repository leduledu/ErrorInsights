import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStats } from '../../models/error-event.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent {
  errorStats = input.required<ErrorStats>();

  totalErrors = computed(() => this.errorStats().totalErrors || 0);
  
  topBrowser = computed(() => {
    const stats = this.errorStats();
    if (!stats.errorsByBrowser) return '';
    
    const browserCounts = stats.errorsByBrowser;
    if (Object.keys(browserCounts).length === 0) return '';
    
    return Object.keys(browserCounts).reduce((a, b) => 
      browserCounts[a] > browserCounts[b] ? a : b, '');
  });

  topUrl = computed(() => {
    const stats = this.errorStats();
    if (!stats.errorsByUrl) return '';
    
    const urlCounts = stats.errorsByUrl;
    if (Object.keys(urlCounts).length === 0) return '';
    
    return Object.keys(urlCounts).reduce((a, b) => 
      urlCounts[a] > urlCounts[b] ? a : b, '');
  });

  topErrorMessage = computed(() => {
    const stats = this.errorStats();
    if (!stats.topErrorMessages || stats.topErrorMessages.length === 0) return '';
    
    const topErrorMessages = stats.topErrorMessages;
    const topErrorMessage = topErrorMessages.reduce((a, b) => 
      a.count > b.count ? a : b, topErrorMessages[0]);
    
    return topErrorMessage.message;
  });

  averageErrorPerUser = computed(() => this.errorStats().averageErrorsPerUser || 0);
}