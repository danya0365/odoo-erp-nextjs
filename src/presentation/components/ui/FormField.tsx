// FormField — wrapper รวม Label + control + hint + error
//  - gen id อัตโนมัติ แล้ว inject id / aria-describedby / aria-invalid ให้ control (child เดียว)
//  - ใช้คู่กับ Input/Textarea/Select/... : <FormField label="อีเมล" error={...}><Input/></FormField>
import { cloneElement, isValidElement, useId, type ReactElement } from "react";

import { cn } from "@/src/presentation/components/ui/cn";
import { Label } from "@/src/presentation/components/ui/Label";

export interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    error?: boolean;
  }>;
}

export function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        error: error ? true : children.props.error,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {control}
      {error ? (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
