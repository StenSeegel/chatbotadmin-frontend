import type { Story } from "@ladle/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default { title: "UI / Card" };

export const Basic: Story = () => (
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Widget-Statistik</CardTitle>
      <CardDescription>Letzte 30 Tage</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-on-surface-variant">1 284 Konversationen, 92 % gelöst.</p>
    </CardContent>
    <CardFooter className="justify-end">
      <Button variant="outline" size="sm">
        Details
      </Button>
    </CardFooter>
  </Card>
);

export const PaddedContainer: Story = () => (
  <Card className="max-w-sm p-6">
    <p>Card ohne Sub-Parts — Padding per <code>className="p-6"</code>.</p>
  </Card>
);
