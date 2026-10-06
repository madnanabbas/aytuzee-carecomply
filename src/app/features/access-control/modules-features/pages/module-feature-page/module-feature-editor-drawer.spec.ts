import { FormBuilder } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuleFeatureEditorDrawerComponent } from './module-feature-editor-drawer';

describe('ModuleFeatureEditorDrawerComponent', () => {
  let fixture: ComponentFixture<ModuleFeatureEditorDrawerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ModuleFeatureEditorDrawerComponent] });
    const formBuilder = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(ModuleFeatureEditorDrawerComponent);
    fixture.componentRef.setInput('state', {
      kind: 'feature',
      mode: 'edit',
      feature: {
        id: 11,
        moduleId: 1,
        parentFeatureId: 10,
        key: 'child',
        name: 'Child',
        route: '/child',
        iconKey: 'child',
        sortOrder: 10,
        isActive: true,
      },
    });
    fixture.componentRef.setInput(
      'moduleForm',
      formBuilder.nonNullable.group({ name: '', key: '', sortOrder: 10, isActive: true }),
    );
    fixture.componentRef.setInput(
      'featureForm',
      formBuilder.nonNullable.group({
        moduleId: 1,
        name: 'Child',
        key: 'child',
        route: '/child',
        iconKey: 'child',
        parentFeatureId: formBuilder.control<number | null>(10),
        sortOrder: 10,
        isActive: true,
      }),
    );
    fixture.componentRef.setInput('modules', [
      {
        id: 1,
        key: 'people',
        name: 'People',
        sortOrder: 10,
        isActive: true,
        features: [],
      },
    ]);
    fixture.componentRef.setInput('featureModule', null);
    fixture.componentRef.setInput('saving', false);
    fixture.detectChanges();
  });

  it('clears the parent when the feature module changes', () => {
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      'select[formcontrolname="moduleId"]',
    );

    select?.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.featureForm.controls.parentFeatureId.value).toBeNull();
  });

  it('emits save and close requests without performing mutations', () => {
    const save = vi.fn();
    const close = vi.fn();
    fixture.componentInstance.saveRequested.subscribe(save);
    fixture.componentInstance.closeRequested.subscribe(close);
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );

    buttons.find((button) => button.textContent?.trim() === 'Save changes')?.click();
    buttons.find((button) => button.textContent?.trim() === 'Cancel')?.click();

    expect(save).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
