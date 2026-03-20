import type { ZodError } from "zod";

export type FieldError = {
  field: string;
  message: string;
};

export function toFieldErrors(error: ZodError): FieldError[] {
  return error.errors.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
