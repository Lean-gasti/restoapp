import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  value?: any;
  validators?: ValidatorFn[];
  options?: { value: string; label: string }[];
}

export interface FormDialogData {
  title: string;
  fields: FormFieldConfig[];
  submitText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-form-dialog',
  standalone: false,
  templateUrl: './form-dialog.html',
  styleUrl: './form-dialog.scss'
})
export class FormDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormDialogData,
    private fb: FormBuilder
  ) {
    this.data.submitText = this.data.submitText || 'Guardar';
    this.data.cancelText = this.data.cancelText || 'Cancelar';
    
    // Construir el formulario dinámicamente
    const formControls: { [key: string]: any } = {};
    for (const field of this.data.fields) {
      formControls[field.name] = [field.value || '', field.validators || []];
    }
    this.form = this.fb.group(formControls);
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
