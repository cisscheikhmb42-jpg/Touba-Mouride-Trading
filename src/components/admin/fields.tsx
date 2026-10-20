"use client";

import { useId } from "react";

/** Champs de formulaire de l'administration. */
export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  help,
  placeholder,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text" | "tel" | "email" | "url";
  maxLength?: number;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-describedby={help ? `${id}-help` : undefined}
        className="field"
      />
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  help?: string;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? ""} aria-describedby={help ? `${id}-help` : undefined} className="field resize-y" />
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, name, defaultChecked, help }: { label: string; name: string; defaultChecked?: boolean; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-5 shrink-0 accent-brand-700" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {help && <span className="block text-xs text-muted">{help}</span>}
      </span>
    </label>
  );
}

export function Panel({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
