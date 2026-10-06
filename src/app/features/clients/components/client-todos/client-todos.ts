import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientTodoApiService } from '../../data-access/client-todo-api.service';
import {
  ClientTodo,
  ClientTodoPriority,
  ClientTodoUser,
  SaveClientTodoRequest,
} from '../../models/client-todo.models';

@Component({
  selector: 'app-client-todos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-todos.html',
  styleUrl: './client-todos.css',
})
export class ClientTodosComponent implements OnInit {
  readonly clientId = input.required<string>();
  readonly openCountChange = output<number>();
  private readonly api = inject(ClientTodoApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly todos = signal<readonly ClientTodo[]>([]);
  readonly assignees = signal<readonly ClientTodoUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly panelOpen = signal(false);
  readonly editing = signal<ClientTodo | null>(null);
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientTodo.Create),
  );
  readonly canEdit = computed(() => this.authorization.hasPermission(Permissions.ClientTodo.Edit));
  readonly canComplete = computed(() =>
    this.authorization.hasPermission(Permissions.ClientTodo.Complete),
  );
  readonly canReopen = computed(() =>
    this.authorization.hasPermission(Permissions.ClientTodo.Reopen),
  );
  readonly canCancel = computed(() =>
    this.authorization.hasPermission(Permissions.ClientTodo.Cancel),
  );
  readonly priorities: readonly ClientTodoPriority[] = ['Low', 'Normal', 'High', 'Urgent'];
  readonly draft = {
    title: '',
    assignedToUserId: '',
    dueDate: '',
    priority: 'Normal' as ClientTodoPriority,
    description: '',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      todos: this.api.list(this.clientId()),
      assignees: this.api.assignees(this.clientId()),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (x) => {
          this.setTodos(x.todos);
          this.assignees.set(x.assignees);
        },
        error: () => this.error.set('To-dos could not be loaded.'),
      });
  }
  add(): void {
    this.editing.set(null);
    this.resetDraft();
    this.panelOpen.set(true);
  }
  edit(todo: ClientTodo): void {
    this.editing.set(todo);
    Object.assign(this.draft, {
      title: todo.title,
      assignedToUserId: todo.assignedTo.id,
      dueDate: todo.dueDate ?? '',
      priority: todo.priority,
      description: todo.description,
    });
    this.panelOpen.set(true);
  }
  close(): void {
    if (!this.saving()) this.panelOpen.set(false);
  }
  save(): void {
    if (this.saving() || !this.draft.title.trim() || !this.draft.assignedToUserId) return;
    this.saving.set(true);
    this.error.set(null);
    const current = this.editing();
    const request: SaveClientTodoRequest = {
      title: this.draft.title.trim(),
      description: this.draft.description.trim() || null,
      assignedToUserId: this.draft.assignedToUserId,
      dueDate: this.draft.dueDate || null,
      priority: this.draft.priority,
      ...(current ? { editorVersion: current.editorVersion } : {}),
    };
    const operation = current
      ? this.api.update(this.clientId(), current.id, request)
      : this.api.create(this.clientId(), request);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.setTodos(
            current
              ? this.todos().map((x) => (x.id === saved.id ? saved : x))
              : [saved, ...this.todos()],
          );
          this.panelOpen.set(false);
        },
        error: (e) =>
          this.error.set(
            e?.status === 409
              ? 'This to-do changed or its status no longer allows that action. Refresh and try again.'
              : 'The to-do could not be saved.',
          ),
      });
  }
  transition(todo: ClientTodo, action: 'complete' | 'reopen' | 'cancel'): void {
    if (this.saving()) return;
    if (action === 'cancel' && !window.confirm(`Cancel "${todo.title}"?`)) return;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .transition(this.clientId(), todo, action)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => this.setTodos(this.todos().map((x) => (x.id === saved.id ? saved : x))),
        error: (e) =>
          this.error.set(
            e?.status === 409
              ? 'This to-do changed. Refresh and try again.'
              : 'The action could not be completed.',
          ),
      });
  }
  dueDate(value: string | null): string {
    return value ? new Intl.DateTimeFormat('en-US').format(new Date(`${value}T00:00:00`)) : '—';
  }
  status(value: ClientTodo['status']): string {
    return value === 'InProgress' ? 'In progress' : value;
  }
  private setTodos(items: readonly ClientTodo[]): void {
    this.todos.set(items);
    this.openCountChange.emit(
      items.filter((todo) => todo.status === 'Open' || todo.status === 'InProgress').length,
    );
  }
  private resetDraft(): void {
    Object.assign(this.draft, {
      title: '',
      assignedToUserId: '',
      dueDate: '',
      priority: 'Normal',
      description: '',
    });
  }
}
