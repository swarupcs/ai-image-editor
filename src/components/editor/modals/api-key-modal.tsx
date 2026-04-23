import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorState';
import { toast } from 'sonner';
import { Loader2, Key } from 'lucide-react';

export function ApiKeyModal() {
  const showApiKeyModal = useEditorStore((s) => s.showApiKeyModal);
  const setShowApiKeyModal = useEditorStore((s) => s.setShowApiKeyModal);
  const setApiKey = useEditorStore((s) => s.setApiKey);
  
  const [keyInput, setKeyInput] = useState('');

  const handleSave = () => {
    if (!keyInput.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setApiKey(keyInput.trim());
    setShowApiKeyModal(false);
    setKeyInput('');
    toast.success('API key saved locally! You can now generate for free.');
  };

  return (
    <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Key className="w-5 h-5 text-purple-400" />
            Bring Your Own Key
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            You have run out of credits. To continue using the application seamlessly, please enter your own Gemini API Key from Google AI Studio.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-zinc-300">Gemini API Key</Label>
            <Input 
              id="api-key"
              type="password"
              placeholder="AIzaSy..." 
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
            />
            <p className="text-xs text-zinc-500">
              Your key is stored securely in your browser's local storage and is never sent to our database.
              You can get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setShowApiKeyModal(false)}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!keyInput.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
