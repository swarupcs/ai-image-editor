'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { resetAllCredits } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ResetCreditsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleReset = async () => {
    setIsPending(true);
    try {
      const res = await resetAllCredits();
      toast.success(res.message);
      setIsOpen(false);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to reset credits');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset All Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Reset All Credits</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This will reset the credit balance for ALL users to the default amount defined in System Settings. An ADMIN_UPDATE transaction log will be created for each user. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={isPending} className="bg-purple-600 hover:bg-purple-500 text-white">
            {isPending ? 'Resetting...' : 'Yes, Reset All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
