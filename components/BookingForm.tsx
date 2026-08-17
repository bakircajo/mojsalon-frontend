"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export interface BookingFormValues {
  client_name: string;
  client_email: string;
  client_phone: string;
}

export default function BookingForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: BookingFormValues) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<BookingFormValues>({
    client_name: "",
    client_email: "",
    client_phone: "",
  });
  const [errors, setErrors] = useState<Partial<BookingFormValues>>({});

  function handleChange(field: keyof BookingFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function validate(): boolean {
    const next: Partial<BookingFormValues> = {};
    if (!values.client_name.trim()) next.client_name = "Unesite ime i prezime.";
    if (!/^\S+@\S+\.\S+$/.test(values.client_email)) next.client_email = "Unesite ispravan email.";
    if (!values.client_phone.trim()) next.client_phone = "Unesite broj telefona.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="client_name"
        label="Ime i prezime"
        placeholder="Amila Hodžić"
        value={values.client_name}
        onChange={(e) => handleChange("client_name", e.target.value)}
        error={errors.client_name}
      />
      <Input
        id="client_email"
        type="email"
        label="Email"
        placeholder="amila@primjer.com"
        value={values.client_email}
        onChange={(e) => handleChange("client_email", e.target.value)}
        error={errors.client_email}
      />
      <Input
        id="client_phone"
        label="Telefon"
        placeholder="+387 61 234 567"
        value={values.client_phone}
        onChange={(e) => handleChange("client_phone", e.target.value)}
        error={errors.client_phone}
      />
      <Button type="submit" loading={submitting} className="mt-2">
        Potvrdi rezervaciju
      </Button>
    </form>
  );
}
