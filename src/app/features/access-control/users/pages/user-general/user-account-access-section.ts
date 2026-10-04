import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RoleMetadata, UserMfaMethod } from '../../models/user-management.models';
import { UserGeneralFormGroup } from './user-general-form.model';

@Component({
  selector: 'app-user-account-access-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-account-access-section.html',
  styleUrls: ['../../user-density.css'],
})
export class UserAccountAccessSectionComponent {
  @Input({ required: true }) form!: UserGeneralFormGroup;
  @Input({ required: true }) isCreateMode = false;
  @Input({ required: true }) canManage = false;
  @Input({ required: true }) loading = false;
  @Input({ required: true }) saving = false;
  @Input({ required: true }) hasMultipleAssignedRoles = false;
  @Input({ required: true }) roles: readonly RoleMetadata[] = [];
  @Input({ required: true }) selectedRoleId = '';
  @Input({ required: true }) mfaEnabled = false;
  @Input({ required: true }) mfaMethod: UserMfaMethod = 'Authenticator';
  @Input({ required: true }) mfaEnrolled = false;

  @Output() readonly roleChanged = new EventEmitter<Event>();
  @Output() readonly mfaEnabledChanged = new EventEmitter<boolean>();
  @Output() readonly mfaMethodChanged = new EventEmitter<UserMfaMethod>();
}
