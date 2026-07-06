import type { Story } from "@ladle/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default { title: "UI / Dialog" };

export const Confirm: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="destructive">Widget löschen</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Widget löschen?</DialogTitle>
        <DialogDescription>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Abbrechen</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="destructive">Löschen</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
