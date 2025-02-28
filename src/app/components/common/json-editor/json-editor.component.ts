import {
  Component, ElementRef, Input, OnInit, ViewChild,
  Output, EventEmitter, forwardRef, ChangeDetectionStrategy
} from '@angular/core';
import * as editor from 'jsoneditor';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { JsonEditorOptions, JsonEditorMode, JsonEditorTreeNode, IError } from './jsoneditoroptions';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'json-editor',
  template: `<div [id]="id" #jsonEditorContainer ></div>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JsonEditorComponent),
      multi: true
    }
  ],
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class JsonEditorComponent implements ControlValueAccessor, OnInit {
  private editor: any;
  public id = 'angjsoneditor' + Math.floor(Math.random() * 1000000);
  public name = 'angjsoneditor';
  disabled = false;

  public optionsChanged = false;

  @ViewChild('jsonEditorContainer') jsonEditorContainer: ElementRef;

  private _data: {};

  @Input() options: JsonEditorOptions = new JsonEditorOptions();
  @Input('data')
  set data(value: string) {
    this._data = this.formatJSON(value);
    if (this.editor) {
      this.editor.destroy();
      this.ngOnInit();
    }
  }

  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }


  ngOnInit() {
    let optionsBefore = this.options;
    if (!this.optionsChanged && this.editor) {
      optionsBefore = this.editor.options;
    }

    if (!this.options.onChange && this.change) {
      this.options.onChange = this.onChange.bind(this);
    }

    const optionsCopy = Object.assign({}, optionsBefore);

    // expandAll is an option only supported by ang-jsoneditor and not by the the original jsoneditor.
    delete optionsCopy.expandAll;

    this.editor = new editor(this.jsonEditorContainer.nativeElement, optionsCopy, this._data);

    if (this.options.expandAll) {
      this.editor.expandAll();
    }
  }


  /**
   * ngModel
   * ControlValueAccessor
   */

  // ControlValueAccessor implementation
  writeValue(value: any) {
    this.data = value;
  }

  // Implemented as part of ControlValueAccessor
  registerOnChange(fn) {
    this.onChangeModel = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Implemented as part of ControlValueAccessor.
  private onTouched = () => {
  }

  // Implemented as part of ControlValueAccessor.
  private onChangeModel = (e) => {
    return e;
  }

  public onChange() {
    this.onChangeModel(this.editor.get());
    this.change.emit(this.editor.get());
  }


  /**
   * JSON EDITOR FUNCTIONS
   */

  public collapseAll() {
    this.editor.collapseAll();
  }

  public expandAll() {
    this.editor.expandAll();
  }

  public focus() {
    this.editor.focus();
  }

  public get(): JSON {
    return this.editor.get();
  }

  public getMode(): JsonEditorMode {
    return this.editor.getMode() as JsonEditorMode;
  }

  public getName(): string {
    return this.editor.getName();
  }

  public getText(): string {
    return this.editor.getText();
  }

  public set(json: JSON) {
    this.editor.set(json);
  }

  public setMode(mode: JsonEditorMode) {
    this.editor.setMode(mode);
  }

  public setName(name: string) {
    this.editor.setName(name);
  }

  public setSelection(start, end) {
    this.editor.setSelection(start, end);
  }

  public getSelection(): any {
    return this.editor.getSelection();
  }

  public getValidateSchema(): any {
    return this.editor.validateSchema;
  }

  public setSchema(schema: any) {
    this.editor.setSchema(schema);
  }

  public search(query: string) {
    this.editor.search(query);
  }

  public setOptions(newOptions: JsonEditorOptions) {
    if (this.editor) {
      this.editor.destroy();
    }
    this.optionsChanged = true;
    this.options = newOptions;
    this.ngOnInit();
  }

  public update(json: JSON) {
    this.editor.update(json);
  }

  public destroy() {
    this.editor.destroy();
  }

  public isValidJson() {
    try {
      JSON.parse(this.getText());
      return true;
    } catch (e) {
      return false;
    }
  }

  public formatJSON(json: string) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return;
    }
  }
}

export { JsonEditorOptions, JsonEditorMode, JsonEditorTreeNode, IError };
