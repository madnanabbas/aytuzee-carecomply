import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permission } from '../../core/authorization/permissions';

@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  readonly appHasPermission = input.required<Permission>();

  private readonly authorization = inject(AuthorizationService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  constructor() {
    effect(() => {
      this.updateView(this.authorization.hasPermission(this.appHasPermission()));
    });
  }

  private updateView(isAllowed: boolean): void {
    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.template);
      this.hasView = true;
      return;
    }

    if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
