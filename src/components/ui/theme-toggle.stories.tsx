import type { Story } from "@ladle/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/theme/ThemeContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default { title: "UI / ThemeToggle" };

/** Toggle light / system / dark and watch the tokens repaint live. */
export const Interactive: Story = () => {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div className="space-y-4">
      <ThemeToggle />
      <p className="text-sm text-on-surface-variant">
        Auswahl: <strong>{theme}</strong> · aktiv: <strong>{resolvedTheme}</strong>
      </p>
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Vorschau</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button>Primär</Button>
          <Button variant="outline">Rahmen</Button>
        </CardContent>
      </Card>
    </div>
  );
};
