import type { Story } from "@ladle/react";
import { Button } from "@/components/ui/button";

export default { title: "UI / Button" };

export const Variants: Story = () => (
  <div className="flex flex-wrap gap-3">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="link">Link</Button>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Icon">
      <span aria-hidden>★</span>
    </Button>
  </div>
);

export const Disabled: Story = () => (
  <div className="flex gap-3">
    <Button disabled>Default</Button>
    <Button variant="outline" disabled>
      Outline
    </Button>
  </div>
);
