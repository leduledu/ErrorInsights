import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ErrorService } from '../../services/error.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-mock-errors',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './mock-errors.component.html',
  styleUrl: './mock-errors.component.scss'
})
export class MockErrorsComponent implements OnInit {
  mockForm = signal<FormGroup | null>(null);

  constructor(
    private fb: FormBuilder,
    private errorService: ErrorService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    const form = this.fb.group({
      intervalMs: [100, [Validators.required, Validators.min(10)]],
      count: [100, [Validators.required, Validators.min(1)]]
    });
    this.mockForm.set(form);
  }

  async startMockErrors(): Promise<void> {
    const form = this.mockForm();
    if (!form || form.invalid) {
      return;
    }

    const formValue = form.value;

    this.loadingService.setLoading(true);

    this.errorService.startMockErrors(formValue.intervalMs, formValue.count).subscribe({
      next: (response) => {
        console.log('Mock errors started successfully', response);
        this.loadingService.hideLoading();
      },
      error: (error) => {
        console.error('Error starting mock errors:', error);
        this.loadingService.hideLoading();
      },
      complete: () => {
        this.loadingService.hideLoading();
      }
    });
  }
}
