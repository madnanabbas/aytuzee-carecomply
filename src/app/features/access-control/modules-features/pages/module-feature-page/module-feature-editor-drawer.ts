import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModuleFeatureItem, NavigationModuleItem } from '../../models/module-feature.models';

export type ModuleEditorState = {
  readonly kind: 'module';
  readonly mode: 'create' | 'edit';
  readonly module: NavigationModuleItem | null;
};

export type FeatureEditorState = {
  readonly kind: 'feature';
  readonly mode: 'create' | 'edit';
  readonly feature: ModuleFeatureItem | null;
};

export type EditorState = ModuleEditorState | FeatureEditorState;

export type ModuleEditorForm = FormGroup<{
  name: FormControl<string>;
  key: FormControl<string>;
  sortOrder: FormControl<number>;
  isActive: FormControl<boolean>;
}>;

export type FeatureEditorForm = FormGroup<{
  moduleId: FormControl<number>;
  name: FormControl<string>;
  key: FormControl<string>;
  route: FormControl<string>;
  iconKey: FormControl<string>;
  parentFeatureId: FormControl<number | null>;
  sortOrder: FormControl<number>;
  isActive: FormControl<boolean>;
}>;

@Component({
  selector: 'app-module-feature-editor-drawer',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './module-feature-editor-drawer.html',
  styleUrls: ['../../../users/user-density.css'],
})
export class ModuleFeatureEditorDrawerComponent {
  @Input({ required: true }) state!: EditorState;
  @Input({ required: true }) moduleForm!: ModuleEditorForm;
  @Input({ required: true }) featureForm!: FeatureEditorForm;
  @Input({ required: true }) modules: readonly NavigationModuleItem[] = [];
  @Input({ required: true }) featureModule: NavigationModuleItem | null = null;
  @Input() saveError: string | null = null;
  @Input({ required: true }) saving = false;

  @Output() readonly closeRequested = new EventEmitter<void>();
  @Output() readonly saveRequested = new EventEmitter<void>();

  resetParentFeature(): void {
    this.featureForm.controls.parentFeatureId.setValue(null);
  }
}
