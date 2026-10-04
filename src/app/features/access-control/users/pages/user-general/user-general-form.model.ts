import { FormControl, FormGroup } from '@angular/forms';

export type UserGeneralFormGroup = FormGroup<{
  companyId: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  phoneNumber: FormControl<string>;
  isActive: FormControl<boolean>;
  locationIds: FormControl<string[]>;
}>;
