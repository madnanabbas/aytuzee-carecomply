import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionMatrixComponent } from './permission-matrix';

describe('PermissionMatrixComponent', () => {
  let fixture: ComponentFixture<PermissionMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PermissionMatrixComponent);
    fixture.componentRef.setInput('modules', [
      {
        id: 2,
        key: 'people',
        name: 'People',
        sortOrder: 20,
        features: [
          {
            id: 2,
            key: 'clients',
            name: 'Clients',
            sortOrder: 10,
            permissions: [
              { id: 2, code: 'Client.View', action: 'View' },
              { id: 50, code: 'ClientTodo.View', action: 'View' },
              { id: 51, code: 'ClientTodo.Create', action: 'Add' },
            ],
          },
        ],
      },
    ]);
    fixture.componentRef.setInput('selectedPermissionIds', new Set<number>());
    fixture.detectChanges();
  });

  it('groups client actions under clear screen section names', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).toContain('Client record');
    expect(content).toContain('To-dos');
    expect(content).toContain('Add');
  });
});
