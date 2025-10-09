import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import Chart from 'chart.js/auto';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
} from 'chart.js';
import { ErrorService } from '../../services/error.service';
import { LoadingService } from '../../services/loading.service';
import { ErrorStats } from '../../models/error-event.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements AfterViewInit {
  
  errorStats = signal<ErrorStats | null>(null);
  
  @ViewChild('browserChart', { static: false }) browserChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('urlChart', { static: false }) urlChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorMessagesChart', { static: false }) errorMessagesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorTimeChart', { static: false }) errorTimeChartRef!: ElementRef<HTMLCanvasElement>;
  
  private browserChart: ChartJS | null = null;
  private urlChart: ChartJS | null = null;
  private errorMessagesChart: ChartJS | null = null;
  private errorTimeChart: ChartJS | null = null;
  
  polarAreaChartType: ChartType = 'polarArea';
  barChartType: ChartType = 'bar';
  lineChartType: ChartType = 'line';

  browserChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  browserChartData = computed(() => {
    const stats = this.errorStats();
    if (!stats?.errorsByBrowser) {
      return { labels: [], datasets: [] };
    }

    const browserCounts = stats.errorsByBrowser;
    const labels = Object.keys(browserCounts);
    const data = Object.values(browserCounts);
    const colors = this.generateColors(labels.length);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    };
  });

  urlChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  urlChartData = computed(() => {
    const stats = this.errorStats();
    if (!stats?.errorsByUrl) {
      return { labels: [], datasets: [] };
    }

    const urlCounts = stats.errorsByUrl;
    const labels = Object.keys(urlCounts);
    const data = Object.values(urlCounts);
    const colors = this.generateColors(labels.length);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    };
  });

  errorMessagesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  errorMessagesChartData = computed(() => {
    const stats = this.errorStats();
    if (!stats?.topErrorMessages || stats.topErrorMessages.length === 0) {
      return { labels: [], datasets: [] };
    }

    const messages = stats.topErrorMessages.slice(0, 10);
    const labels = messages.map(msg => msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message);
    const data = messages.map(msg => msg.count);

    return {
      labels,
      datasets: [{
        data,
        label: 'Error Count',
        backgroundColor: '#f44336',
        borderColor: '#d32f2f',
        borderWidth: 1
      }]
    };
  });

  errorTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  errorTimeChartData = computed(() => {
    const stats = this.errorStats();
    if (!stats?.errorsOverTime || stats.errorsOverTime.length === 0) {
      return { labels: [], datasets: [] };
    }

    const timeData = stats.errorsOverTime;
    const labels = timeData.map(item => new Date(item.date).toLocaleDateString());
    const data = timeData.map(item => item.count);

    return {
      labels,
      datasets: [{
        data,
        label: 'Errors Over Time',
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  });

  constructor(
    private fb: FormBuilder,
    private errorService: ErrorService,
    public loadingService: LoadingService
  ) {    
    Chart.register(
      CategoryScale,
      LinearScale,
      BarElement,
      Title,
      Tooltip,
      Legend,
      ArcElement,
      LineElement,
      PointElement,
      RadialLinearScale
    );

    effect(() => {
      this.loadAnalyticsData();
    });
  }

  ngAfterViewInit(): void {
  }

  private loadAnalyticsData(): void {
    this.loadingService.showLoading('Loading analytics data...');
        
    const filters: any = {
      page: 0,
      pageSize: 1000
    };

    this.errorService.getErrorStats(filters).subscribe({
      next: (response) => {
        this.errorStats.set(response.data);
        
        setTimeout(() => {
          this.createCharts();
          this.createSimpleCharts();
        }, 100);
        
        this.loadingService.hideLoading();
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        this.loadingService.hideLoading();
      }
    });
  }

  updateAnalytics(): void {
    this.loadAnalyticsData();
  }

  private createCharts(): void {
    
    const stats = this.errorStats();
    if (!stats) {
      console.log('No stats available for chart creation');
      return;
    }

    if (this.browserChartRef && stats.errorsByBrowser) {
      if (this.browserChart) {
        this.browserChart.destroy();
      }
      
      const browserData = Object.values(stats.errorsByBrowser);
      const browserLabels = Object.keys(stats.errorsByBrowser);
      const colors = this.generateColors(browserLabels.length);

      this.browserChart = new ChartJS(this.browserChartRef.nativeElement, {
        type: 'polarArea',
        data: {
          labels: browserLabels,
          datasets: [{
            data: browserData,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        }
      });
      console.log('Browser chart created');
    }

    if (this.urlChartRef && stats.errorsByUrl) {
      if (this.urlChart) {
        this.urlChart.destroy();
      }
      
      const urlData = Object.values(stats.errorsByUrl);
      const urlLabels = Object.keys(stats.errorsByUrl);
      const colors = this.generateColors(urlLabels.length);

      this.urlChart = new ChartJS(this.urlChartRef.nativeElement, {
        type: 'polarArea',
        data: {
          labels: urlLabels,
          datasets: [{
            data: urlData,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        }
      });
      console.log('URL chart created');
    }

    if (this.errorMessagesChartRef && stats.topErrorMessages) {
      if (this.errorMessagesChart) {
        this.errorMessagesChart.destroy();
      }
      
      const messages = stats.topErrorMessages.slice(0, 10);
      const labels = messages.map(msg => msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message);
      const data = messages.map(msg => msg.count);

      this.errorMessagesChart = new ChartJS(this.errorMessagesChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            label: 'Error Count',
            backgroundColor: '#f44336',
            borderColor: '#d32f2f',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      console.log('Error messages chart created');
    }

    if (this.errorTimeChartRef && stats.errorsOverTime) {
      if (this.errorTimeChart) {
        this.errorTimeChart.destroy();
      }
      
      const timeData = stats.errorsOverTime;
      const labels = timeData.map(item => new Date(item.date).toLocaleDateString());
      const data = timeData.map(item => item.count);

      this.errorTimeChart = new ChartJS(this.errorTimeChartRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            label: 'Errors Over Time',
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      console.log('Error time chart created');
    }
  }

  private createSimpleCharts(): void {
    console.log('Creating simple charts...');
    
    const stats = this.errorStats();
    if (!stats) {
      console.log('No stats available for simple chart creation');
      return;
    }

    const browserCanvas = document.getElementById('browserChart') as HTMLCanvasElement;
    const urlCanvas = document.getElementById('urlChart') as HTMLCanvasElement;
    const errorMessagesCanvas = document.getElementById('errorMessagesChart') as HTMLCanvasElement;
    const errorTimeCanvas = document.getElementById('errorTimeChart') as HTMLCanvasElement;
    
    console.log('Browser canvas found:', browserCanvas);
    console.log('URL canvas found:', urlCanvas);
    console.log('Error messages canvas found:', errorMessagesCanvas);
    console.log('Error time canvas found:', errorTimeCanvas);

    if (browserCanvas && stats.errorsByBrowser) {
      console.log('Creating browser chart on canvas...');
      const browserData = Object.values(stats.errorsByBrowser);
      const browserLabels = Object.keys(stats.errorsByBrowser);
      const colors = this.generateColors(browserLabels.length);

      try {
        const chart = new ChartJS(browserCanvas, {
          type: 'polarArea',
          data: {
            labels: browserLabels,
            datasets: [{
              data: browserData,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom'
              }
            }
          }
        });
        console.log('Simple browser chart created successfully:', chart);
      } catch (error) {
        console.error('Error creating browser chart:', error);
      }
    }

    if (urlCanvas && stats.errorsByUrl) {
      console.log('Creating URL chart on canvas...');
      const urlData = Object.values(stats.errorsByUrl);
      const urlLabels = Object.keys(stats.errorsByUrl);
      const colors = this.generateColors(urlLabels.length);

      try {
        const chart = new ChartJS(urlCanvas, {
          type: 'polarArea',
          data: {
            labels: urlLabels,
            datasets: [{
              data: urlData,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom'
              }
            }
          }
        });
        console.log('Simple URL chart created successfully:', chart);
      } catch (error) {
        console.error('Error creating URL chart:', error);
      }
    }

    if (errorMessagesCanvas && stats.topErrorMessages) {
      console.log('Creating error messages chart on canvas...');
      const messages = stats.topErrorMessages.slice(0, 10);
      const labels = messages.map(msg => msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message);
      const data = messages.map(msg => msg.count);

      try {
        const chart = new ChartJS(errorMessagesCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data,
              label: 'Error Count',
              backgroundColor: '#f44336',
              borderColor: '#d32f2f',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        console.log('Simple error messages chart created successfully:', chart);
      } catch (error) {
        console.error('Error creating error messages chart:', error);
      }
    }

    if (errorTimeCanvas && stats.errorsOverTime) {
      console.log('Creating error time chart on canvas...');
      const timeData = stats.errorsOverTime;
      const labels = timeData.map(item => new Date(item.date).toLocaleDateString());
      const data = timeData.map(item => item.count);

      try {
        const chart = new ChartJS(errorTimeCanvas, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              data,
              label: 'Errors Over Time',
              borderColor: '#3f51b5',
              backgroundColor: 'rgba(63, 81, 181, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        console.log('Simple error time chart created successfully:', chart);
      } catch (error) {
        console.error('Error creating error time chart:', error);
      }
    }
  }

  private generateColors(count: number): string[] {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b', '#9e9e9e', '#000000'
    ];
    
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  }
}