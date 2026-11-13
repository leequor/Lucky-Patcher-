"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import { useToast } from "../providers/toast-provider";
import { Card } from "../ui/surfaces";
import { Button, Field, Input, Select, Textarea } from "../ui/controls";
import { AlertIcon } from "../ui/icons";
import { createProduct, listProducts, updateProduct } from "@/lib/data/store";
import { RECORD_STATUS, UNITS } from "@/lib/domain/constants";

const EMPTY = {
  code: "",
  description: "",
  unit: "PC",
  status: "active",
  notes: "",
};

export default function ProductForm({
  mode = "create",
  product = null,
  backHref = "/products",
  afterSaveHref,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState(() => (product ? { ...EMPTY, ...product } : EMPTY));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeTouched, setCodeTouched] = useState(mode === "edit");

  const target = afterSaveHref ?? backHref;

  useEffect(() => {
    if (mode !== "create" || codeTouched) return;
    let active = true;

    listProducts({ pageSize: 500, sort: "code" })
      .then((result) => {
        if (!active) return;
        const numbers = result.rows
          .map((row) => Number(String(row.code).replace(/\D/g, "")))
          .filter((value) => Number.isFinite(value) && value > 0);
        const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 2001;
        setValues((current) =>
          current.code ? current : { ...current, code: `PRD-${next}` },
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [mode, codeTouched]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setBusy(true);

    try {
      if (mode === "create") {
        const created = await createProduct(values, user);
        toast({
          title: "Product added",
          description: `${created.code} · ${created.description}`,
        });
      } else {
        const updated = await updateProduct(product.id, values, user);
        toast({
          title: "Product saved",
          description: `${updated.code} · ${updated.description}`,
        });
      }
      router.push(target);
      router.refresh();
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message ?? "We could not save this product.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit}>
      {formError ? (
        <p
          className="flex items-start gap-2.5 rounded-[14px] bg-[#f8e9e4] px-4 py-3 text-[13px] text-[#a23422]"
          role="alert"
        >
          <AlertIcon size={16} />
          <span>{formError}</span>
        </p>
      ) : null}

      <Card className="card-pad">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Product</h2>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          The code identifies the line on every quote and invoice.
        </p>

        <div className="form-grid mt-6">
          <Field
            error={errors.code}
            hint="Letters, numbers and dashes."
            htmlFor="product-code"
            label="Product code"
            required
          >
            <Input
              autoComplete="off"
              error={errors.code}
              id="product-code"
              onBlur={() => setCodeTouched(true)}
              onChange={(event) => update("code", event.target.value.toUpperCase())}
              placeholder="PRD-2001"
              value={values.code}
            />
          </Field>

          <Field
            error={errors.description}
            htmlFor="product-description"
            label="Description"
            required
          >
            <Input
              error={errors.description}
              id="product-description"
              onChange={(event) => update("description", event.target.value)}
              placeholder="Industrial epoxy adhesive, 5 kg pail"
              value={values.description}
            />
          </Field>

          <Field
            error={errors.unit}
            hint="The unit prices and quantities are quoted in."
            htmlFor="product-unit"
            label="Unit"
            required
          >
            <Select
              error={errors.unit}
              id="product-unit"
              onChange={(event) => update("unit", event.target.value)}
              value={values.unit}
            >
              {UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label} ({unit.short})
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={errors.status}
            hint="Inactive keeps the record and its price history."
            htmlFor="product-status"
            label="Status"
            required
          >
            <Select
              error={errors.status}
              id="product-status"
              onChange={(event) => update("status", event.target.value)}
              value={values.status}
            >
              {RECORD_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field className="field-wide" error={errors.notes} htmlFor="product-notes" label="Notes">
            <Textarea
              error={errors.notes}
              id="product-notes"
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Storage rules, substitutions, anything the next person needs."
              rows={3}
              value={values.notes}
            />
          </Field>
        </div>

        {mode === "create" ? (
          <p className="mt-5 rounded-[12px] bg-[color:var(--color-sunken)] px-3.5 py-2.5 text-[12.5px] text-[color:var(--color-ink-soft)]">
            New products start with no price. Add the first dated price on the product
            page, so the list never shows a guessed number.
          </p>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Button href={backHref} variant="ghost">
          Cancel
        </Button>
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
