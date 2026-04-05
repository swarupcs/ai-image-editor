'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  Redo,
  Undo,
  Upload,
  X,
  Layers,
  Save,
  Zap,
  CheckCircle2,
  SplitSquareHorizontal,
  Keyboard,
  FilePlus2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/useEditorState';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExportPanel } from '@/components/export-panel';
import { KeyboardShortcutModal } from '@/components/keyboard-shortcut-modal';
import { toast } from 'sonner';

export function Navbar({
  fileInputRef,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const {
    image,
    undo,
    redo,
    historyIndex,
    history,
    showHistory,
    toggleHistory,
    credits,
    fetchCredits,
    saveCurrentImage,
    toggleBeforeAfter,
    showShortcutsModal,
    setShowShortcutsModal,
    resetEditor,
  } = useEditorStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Inside the Navbar component, after the fetchCredits useEffect:
  useEffect(() => {
    // Only fire once, when the component mounts with a pre-existing image
    if (image) {
      toast.success('Session restored', {
        description: 'Your previous image was reloaded automatically.',
        duration: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only run on mount

  const handleSave = async () => {
    if (!image || saving) return;
    setSaving(true);
    try {
      await saveCurrentImage();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfirm = () => {
    resetEditor();
    setShowResetDialog(false);
  };

  return (
    <>
      <header className='h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 z-50'>
        {/* Left: Branding */}
        <div className='flex items-center gap-3'>
          <Link
            className='flex items-center gap-2.5 font-bold text-lg hover:opacity-90 transition-opacity'
            href='/'
          >
            <div className='relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-linear-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20'>
              <Image
                src='/logo.png'
                alt='ImgStudio AI Logo'
                width={36}
                height={36}
                className='object-cover rounded-md'
                priority
              />
            </div>
            <span className='text-zinc-100 hidden md:block tracking-tight'>
              {`ImgStudio `}
              <span className='text-yellow-500'>AI</span>
            </span>
          </Link>
        </div>

        {/* Center: Undo/Redo */}
        <div className='flex items-center gap-1'>
          <TooltipProvider delayDuration={300}>
            <div className='flex items-center bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800/50'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-md'
                  >
                    <Undo size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  Undo
                </TooltipContent>
              </Tooltip>

              <div className='h-4 w-px bg-zinc-800 mx-0.5' />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-md'
                  >
                    <Redo size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  Redo
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Right: Actions */}
        <div className='flex items-center gap-2'>
          <TooltipProvider delayDuration={300}>
            {/* Credits badge */}
            {credits !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium',
                      credits > 5
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400',
                    )}
                  >
                    <Zap size={12} />
                    {credits}
                  </div>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {credits} generation credit{credits !== 1 ? 's' : ''}{' '}
                  remaining
                </TooltipContent>
              </Tooltip>
            )}

            {/* New Session button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowResetDialog(true)}
                  disabled={!image}
                  variant='ghost'
                  size='sm'
                  className='h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5 md:px-3'
                >
                  <FilePlus2 size={14} className='md:mr-1.5' />
                  <span className='hidden md:inline text-xs'>New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>
                Start New Session
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant='ghost'
                  size='sm'
                  className='h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5 md:px-3'
                >
                  <Upload size={14} className='md:mr-1.5' />
                  <span className='hidden md:inline text-xs'>Upload</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs md:hidden'>
                Upload
              </TooltipContent>
            </Tooltip>

            {/* Save to gallery */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSave}
                  disabled={!image || saving}
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'h-8 px-2.5 md:px-3 text-xs',
                    saved
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80',
                  )}
                >
                  {saved ? (
                    <CheckCircle2 size={14} className='md:mr-1.5' />
                  ) : (
                    <Save size={14} className='md:mr-1.5' />
                  )}
                  <span className='hidden md:inline'>
                    {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs md:hidden'>
                Save to Gallery
              </TooltipContent>
            </Tooltip>

            {/* Compare before/after */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleBeforeAfter}
                  disabled={!image}
                  variant='ghost'
                  size='sm'
                  className='h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5 md:px-3'
                >
                  <SplitSquareHorizontal size={14} className='md:mr-1.5' />
                  <span className='hidden md:inline text-xs'>Compare</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>
                Compare Before/After
              </TooltipContent>
            </Tooltip>

            {/* Export options */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowExport(true)}
                  disabled={!image}
                  size='sm'
                  className='h-8 bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium px-2.5 md:px-3 rounded-lg border-0 text-xs'
                >
                  <Download size={14} className='md:mr-1.5' />
                  <span className='hidden md:inline'>Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs md:hidden'>
                Export
              </TooltipContent>
            </Tooltip>

            {/* History Toggle + Shortcuts */}
            <div className='hidden md:flex items-center gap-1'>
              <div className='h-5 w-px bg-zinc-800 mx-1' />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleHistory}
                    className={cn(
                      'h-8 w-8 rounded-lg transition-all duration-200',
                      showHistory
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80',
                    )}
                  >
                    {showHistory ? <X size={15} /> : <Layers size={15} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {showHistory ? 'Close History' : 'Open History'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowShortcutsModal(true)}
                    className='h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80'
                  >
                    <Keyboard size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  Keyboard Shortcuts (?)
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {showExport && <ExportPanel onClose={() => setShowExport(false)} />}
      <KeyboardShortcutModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-zinc-100'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-zinc-100'>
              Start New Session?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400'>
              This will clear your current image and reset the editor. Make sure
              to save your work first if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className='bg-purple-600 hover:bg-purple-500 text-white'
            >
              Start New Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
