"use client";

import { useEditorStore } from "@/store/useEditorState";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function VariationsOverlay() {
  const { generatedVariations, setGeneratedVariations, setImage } = useEditorStore();
  const [selectingIdx, setSelectingIdx] = useState<number | null>(null);

  if (!generatedVariations || generatedVariations.length === 0) return null;

  const handleSelect = (index: number) => {
    setSelectingIdx(index);
    // Simulate a tiny delay for visual feedback
    setTimeout(() => {
      setImage(generatedVariations[index]);
      setGeneratedVariations(null);
      setSelectingIdx(null);
    }, 300);
  };

  const handleCancel = () => {
    setGeneratedVariations(null);
  };

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">Select a Variation</h2>
          <p className="text-zinc-400">Pick your favorite generation to continue editing.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {generatedVariations.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className="relative group aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all cursor-pointer bg-zinc-900"
              onClick={() => handleSelect(idx)}
            >
              <Image 
                src={imgUrl} 
                alt={`Variation ${idx + 1}`} 
                fill 
                className="object-cover"
                unoptimized
              />
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {selectingIdx === idx ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white border-0">
                    <Check className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="ghost" onClick={handleCancel} className="text-zinc-400 hover:text-zinc-100">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
