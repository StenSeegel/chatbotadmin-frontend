import type { Story } from "@ladle/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export default { title: "UI / Form" };

export const Field: Story = () => (
  <FormItem className="max-w-sm">
    <FormLabel>Benutzername</FormLabel>
    <FormControl>
      <Input placeholder="z. B. anna" />
    </FormControl>
    <FormDescription>Öffentlich sichtbar.</FormDescription>
  </FormItem>
);

export const WithError: Story = () => (
  <FormItem className="max-w-sm" error="Bitte eine gültige E-Mail eingeben.">
    <FormLabel>E-Mail</FormLabel>
    <FormControl>
      <Input type="email" defaultValue="not-an-email" />
    </FormControl>
    <FormMessage />
  </FormItem>
);

export const LiveValidation: Story = () => {
  const [value, setValue] = useState("");
  const error = value && !value.includes("@") ? "Ungültige E-Mail." : undefined;
  return (
    <form
      className="max-w-sm space-y-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <FormItem error={error}>
        <FormLabel>E-Mail</FormLabel>
        <FormControl>
          <Input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
      <Button type="submit">Speichern</Button>
    </form>
  );
};

export const StandaloneLabelInput: Story = () => (
  <div className="flex max-w-sm flex-col gap-1">
    <Label htmlFor="q">Suche</Label>
    <Input id="q" placeholder="Suchen…" />
  </div>
);
