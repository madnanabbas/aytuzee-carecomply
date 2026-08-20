import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permission, Permissions } from '../../core/authorization/permissions';
import { HasPermissionDirective } from './has-permission';

@Component({
  imports: [HasPermissionDirective],
  template: '<span *appHasPermission="requiredPermission" data-testid="protected">Protected</span>',
})
class PermissionHostComponent {
  readonly requiredPermission: Permission = Permissions.Client.View;
}

describe('HasPermissionDirective', () => {
  let authorization: AuthorizationService;
  let fixture: ComponentFixture<PermissionHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionHostComponent],
    }).compileComponents();

    authorization = TestBed.inject(AuthorizationService);
    fixture = TestBed.createComponent(PermissionHostComponent);
  });

  it('should remove denied content from the DOM', () => {
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(0);
  });

  it('should render permitted content', () => {
    authorization.setPermissions([Permissions.Client.View]);
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(1);
  });

  it('should react when permission is added', () => {
    fixture.detectChanges();
    authorization.setPermissions([Permissions.Client.View]);
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(1);
  });

  it('should react when permissions are replaced', () => {
    authorization.setPermissions([Permissions.Client.View]);
    fixture.detectChanges();
    authorization.setPermissions([Permissions.Employee.View]);
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(0);
  });

  it('should react when permissions are cleared', () => {
    authorization.setPermissions([Permissions.Client.View]);
    fixture.detectChanges();
    authorization.clearPermissions();
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(0);
  });

  it('should not create duplicate embedded views', () => {
    authorization.setPermissions([Permissions.Client.View]);
    fixture.detectChanges();
    authorization.setPermissions([Permissions.Client.View, Permissions.Client.View]);
    fixture.detectChanges();

    expect(protectedContent()).toHaveLength(1);
  });

  function protectedContent(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('[data-testid="protected"]');
  }
});
