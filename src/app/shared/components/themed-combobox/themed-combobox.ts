import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-themed-combobox',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './themed-combobox.html',
})
export class ThemedComboboxComponent {
  @Input() value = '';
  @Input() options: readonly string[] = [];
  @Input() placeholder = '';
  @Input() autocomplete = 'off';
  @Output() readonly valueChange = new EventEmitter<string>();

  readonly open = signal(false);

  get filteredOptions(): readonly string[] {
    const query = this.value.trim().toLocaleLowerCase();
    return (query
      ? this.options.filter((option) => option.toLocaleLowerCase().includes(query))
      : this.options).slice(0, 100);
  }

  update(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.open.set(true);
  }

  select(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.open.set(false);
  }

  closeAfterSelection(): void {
    window.setTimeout(() => this.open.set(false), 120);
  }
}
