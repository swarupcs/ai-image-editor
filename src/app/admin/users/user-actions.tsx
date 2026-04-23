'use client';

import { useState } from 'react';
import { MoreHorizontal, Shield, Coins, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateUserCredits, toggleUserRole, deleteUser } from '../actions';
import { toast } from 'sonner';

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  credits: number;
};

export function UserActions({ user }: { user: UserData }) {
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [creditInput, setCreditInput] = useState(user.credits.toString());
  const [isPending, setIsPending] = useState(false);

  const handleUpdateCredits = async () => {
    const newCredits = parseInt(creditInput, 10);
    if (isNaN(newCredits)) return;

    setIsPending(true);
    try {
      await updateUserCredits(user.id, newCredits);
      toast.success(`Credits updated for ${user.email}`);
      setIsCreditDialogOpen(false);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Failed to update credits');
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleRole = async () => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to make ${user.email} a ${newRole}?`)) return;

    try {
      await toggleUserRole(user.id, newRole);
      toast.success(`Role updated for ${user.email}`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    setIsPending(true);
    try {
      await deleteUser(user.id);
      toast.success('User deleted');
      setIsDeleteDialogOpen(false);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
          <DropdownMenuItem onClick={() => setIsCreditDialogOpen(true)} className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
            <Coins className="mr-2 h-4 w-4" />
            Edit Credits
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleRole} className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            Toggle Admin Role
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Credit Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Edit Credits</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update the credit balance for {user.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              value={creditInput}
              onChange={(e) => setCreditInput(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreditDialogOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              Cancel
            </Button>
            <Button onClick={handleUpdateCredits} disabled={isPending} className="bg-purple-600 hover:bg-purple-500 text-white">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to permanently delete {user.email}? This action cannot be undone and will delete all their generated images.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} disabled={isPending} className="bg-red-600 hover:bg-red-500 text-white">
              {isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}