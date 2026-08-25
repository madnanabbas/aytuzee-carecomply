import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { UserEditorStore } from '../../data-access/user-editor.store';

@Component({
  selector: 'app-user-editor-page',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './user-editor-page.html',
})
export class UserEditorPageComponent {
  readonly store = inject(UserEditorStore);
  private readonly route = inject(ActivatedRoute);
  readonly isCreateMode = this.route.snapshot.data['createMode'] === true;
  readonly userId = this.route.snapshot.paramMap.get('userId') ?? '';

  constructor() {
    if (this.isCreateMode) {
      this.store.initializeCreate();
    } else if (this.userId) {
      this.store.load(this.userId);
    }
  }
}
