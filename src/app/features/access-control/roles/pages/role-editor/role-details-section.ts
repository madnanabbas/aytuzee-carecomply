import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Company } from '../../../../../core/lookups/company-lookup.service';

export type RoleEditorFormGroup = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  companyId: FormControl<string>;
}>;

@Component({
  selector: 'app-role-details-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './role-details-section.html',
  styleUrls: ['../../../users/user-density.css'],
})
export class RoleDetailsSectionComponent {
  @Input({ required: true }) form!: RoleEditorFormGroup;
  @Input({ required: true }) isCreateMode = false;
  @Input({ required: true }) isPlatformAdministrator = false;
  @Input({ required: true }) companies: readonly Company[] = [];
}
