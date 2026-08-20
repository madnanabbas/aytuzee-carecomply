import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideMail,
  LucideUserPlus,
} from '@lucide/angular';

@Component({
  selector: 'app-register-user-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideMail,
    LucideUserPlus,
  ],
  templateUrl: './register-user-page.html',
})
export class RegisterUserPageComponent {
  readonly submissionAttempted = signal(false);

  readonly roles = [
    {
      id: 'system-administrator',
      name: 'System Administrator',
      description: 'Full administrative and configuration access.',
    },
    {
      id: 'compliance-manager',
      name: 'Compliance Manager',
      description: 'Compliance, client and document management access.',
    },
    {
      id: 'hr-manager',
      name: 'HR Manager',
      description: 'Employee, training and background-check access.',
    },
    {
      id: 'read-only',
      name: 'Read Only',
      description: 'View-only access to permitted areas.',
    },
  ] as const;

  readonly form = new FormBuilder().nonNullable.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],

    lastName: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(256),
      ],
    ],

    role: [
      '',
      Validators.required,
    ],

    isActive: true,

    requireMfa: true,

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
      ],
    ],
  });

  submit(): void {
    this.submissionAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log(this.form.getRawValue());
  }

  reset(): void {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      isActive: true,
      requireMfa: true,
      password: '',
    });

    this.submissionAttempted.set(false);
  }
}