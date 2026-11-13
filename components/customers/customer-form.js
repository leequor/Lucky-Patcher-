"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import { useToast } from "../providers/toast-provider";
import { Card } from "../ui/surfaces";
import { Button, Field, Input, Select, Textarea } from "../ui/controls";
import { AlertIcon } from "../ui/icons";
import { createCustomer, listCustomers, updateCustomer } from "@/lib/data/store";
import { PAY_TERMS, RECORD_STATUS } from "@/lib/domain/constants";

const EMPTY = {
  code: "",
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  payTerms: "NET_30",
  status: "active",
  notes: "",
};

export default function CustomerForm({
  mode = "create",
  customer = null,
  backHref = "/customers",
  afterSaveHref,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState(() =>
    customer ? { ...EMPTY, ...customer } : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeTouched, setCodeTouched] = useState(mode === "edit");

  const target = afterSaveHref ?? backHref;

  useEffect(() => {
    if (mode !== "create" || codeTouched) return;
    let active = true;

    listCustomers({ pageSize: 500, sort: "code" })
      .then((result) => {
        if (!active) return;
        const numbers = result.rows
          .map((row) => Number(String(row.code).replace(/\D/g, "")))
          .filter((value) => Number.isFinite(value) && value > 0);
        const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;
        setValues((current) =>
          current.code ? current : { ...current, code: `CUS-${next}` },
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
        const created = await createCustomer(values, user);
        toast({
          title: "Customer added",
          description: `${created.code} · ${created.name}`,
        });
      } else {
        const updated = await updateCustomer(customer.id, values, user);
        toast({
          title: "Customer saved",
          description: `${updated.code} · ${updated.name}`,
        });
      }
      router.push(target);
      router.refresh();
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message ?? "We could not save this customer.");
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
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Identity</h2>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          The code is what staff quote on the phone. It stays unique for the life of the
          record.
        </p>

        <div className="form-grid mt-6">
          <Field
            error={errors.code}
            hint="Letters, numbers and dashes."
            htmlFor="customer-code"
            label="Customer code"
            required
          >
            <Input
              autoComplete="off"
              error={errors.code}
              id="customer-code"
              onBlur={() => setCodeTouched(true)}
              onChange={(event) => update("code", event.target.value.toUpperCase())}
              placeholder="CUS-1001"
              value={values.code}
            />
          </Field>

          <Field error={errors.name} htmlFor="customer-name" label="Customer name" required>
            <Input
              error={errors.name}
              id="customer-name"
              onChange={(event) => update("name", event.target.value)}
              placeholder="Northwind Traders"
              value={values.name}
            />
          </Field>
        </div>
      </Card>

      <Card className="card-pad">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Contact</h2>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Search finds a customer by any of these fields.
        </p>

        <div className="form-grid mt-6">
          <Field error={errors.contactPerson} htmlFor="customer-contact" label="Contact person">
            <Input
              autoComplete="off"
              error={errors.contactPerson}
              id="customer-contact"
              onChange={(event) => update("contactPerson", event.target.value)}
              placeholder="Elena Reyes"
              value={values.contactPerson}
            />
          </Field>

          <Field error={errors.email} htmlFor="customer-email" label="Email">
            <Input
              autoComplete="off"
              error={errors.email}
              id="customer-email"
              onChange={(event) => update("email", event.target.value)}
              placeholder="name@company.com"
              type="email"
              value={values.email}
            />
          </Field>

          <Field error={errors.phone} htmlFor="customer-phone" label="Phone">
            <Input
              autoComplete="off"
              error={errors.phone}
              id="customer-phone"
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+63 917 000 0000"
              type="tel"
              value={values.phone}
            />
          </Field>

          <Field error={errors.address} htmlFor="customer-address" label="Address">
            <Input
              autoComplete="off"
              error={errors.address}
              id="customer-address"
              onChange={(event) => update("address", event.target.value)}
              placeholder="Street, city"
              value={values.address}
            />
          </Field>
        </div>
      </Card>

      <Card className="card-pad">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Terms and status</h2>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Only the listed terms are accepted; the database enforces the same list.
        </p>

        <div className="form-grid mt-6">
          <Field
            error={errors.payTerms}
            hint="Applied to every quote for this customer."
            htmlFor="customer-terms"
            label="Payment terms"
            required
          >
            <Select
              error={errors.payTerms}
              id="customer-terms"
              onChange={(event) => update("payTerms", event.target.value)}
              value={values.payTerms}
            >
              {PAY_TERMS.map((term) => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={errors.status}
            hint="Inactive keeps the record and hides it from new work."
            htmlFor="customer-status"
            label="Status"
            required
          >
            <Select
              error={errors.status}
              id="customer-status"
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

          <Field className="field-wide" error={errors.notes} htmlFor="customer-notes" label="Notes">
            <Textarea
              error={errors.notes}
              id="customer-notes"
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Delivery instructions, billing quirks, anything the next person needs."
              rows={3}
              value={values.notes}
            />
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Button href={backHref} variant="ghost">
          Cancel
        </Button>
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : mode === "create" ? "Create customer" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
