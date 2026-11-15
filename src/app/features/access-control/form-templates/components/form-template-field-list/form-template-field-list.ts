import { Component, computed, input, signal } from '@angular/core';
import { FormTemplateField } from '../../models/form-template.models';

@Component({
  selector: 'app-form-template-field-list',
  standalone: true,
  templateUrl: './form-template-field-list.html',
})
export class FormTemplateFieldListComponent {
  readonly fields = input.required<readonly FormTemplateField[]>();
  readonly search = signal('');
  readonly filteredFields = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return term
      ? this.fields().filter((field) =>
          [field.pdfFieldName, field.pdfFieldType, field.fieldPurpose].some((value) =>
            value.toLocaleLowerCase().includes(term),
          ),
        )
      : this.fields();
  });

  updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.search.set(event.target.value);
  }
}
