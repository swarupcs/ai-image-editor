'use client';

import { useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteImage } from '../actions';
import { toast } from 'sonner';

export function ImageActions({ imageId }: { imageId: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setIsPending(true);
    try {
      await deleteImage(imageId);
      toast.success('Image deleted');
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
      <Button
        onClick={() => window.open(`/p/${imageId}`, '_blank')}
        variant="secondary"
        size="icon"
        className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-0"
        title="View public page"
      >
        <ExternalLink size={14} />
      </Button>
      <Button
        onClick={handleDelete}
        disabled={isPending}
        variant="destructive"
        size="icon"
        className="w-8 h-8 rounded-full bg-red-900/80 hover:bg-red-800 text-red-300 border-0"
        title="Delete image"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}