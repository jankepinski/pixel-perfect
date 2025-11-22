'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Settings, Image as ImageIcon, Wand2, Loader2 } from 'lucide-react';
import { PixelProcessor, PixelData } from '@/lib/PixelProcessor';
import { generateImage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RotateCcw, Info } from "lucide-react";

export default function ConverterUI() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedData, setProcessedData] = useState<PixelData | null>(null);
  const [gridSize, setGridSize] = useState<number>(10);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('32x32');
  const [showGrid, setShowGrid] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const gridOverlayRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setGridOffset({ x: 0, y: 0 });
        processImage(img, true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
      if (!prompt) return;
      setIsGenerating(true);
      try {
          const fullPrompt = `A single ${prompt}, isolated on a plain white background. ${resolution} pixel art resolution. Authentic retro game sprite style. Strict grid alignment, hard edges, nearest-neighbor interpolation. No anti-aliasing, no blur, no gradients. Chunky pixels, limited color palette, flat colors. Sharp definition, zoomed in view to fit the canvas.`;
          
          const base64Image = await generateImage(fullPrompt);
          
          const img = new Image();
          img.onload = () => {
              setOriginalImage(img);
              setGridOffset({ x: 0, y: 0 });
              processImage(img, true);
              setIsGenerating(false);
          };
          img.src = base64Image;
      } catch (error) {
          console.error("Generation failed", error);
          alert("Failed to generate image. Please check your API key.");
          setIsGenerating(false);
      }
  };

  const processImage = (img: HTMLImageElement, autoDetect: boolean = false) => {
    setIsProcessing(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    setTimeout(() => {
      let currentGridSize = gridSize;
      if (autoDetect) {
        const detection = PixelProcessor.detectGrid(imageData);
        currentGridSize = detection.size;
        setGridSize(currentGridSize);
      }

      let pixelData = PixelProcessor.extractPixelArt(imageData, currentGridSize, gridOffset);
      pixelData = PixelProcessor.removeBackground(pixelData);
      pixelData = PixelProcessor.trimToContent(pixelData);
      
      setProcessedData(pixelData);
      setIsProcessing(false);
    }, 100);
  };

  // Redraw grid overlay
  useEffect(() => {
    if (originalImage && gridOverlayRef.current) {
        const canvas = gridOverlayRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = gridOffset.x; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = gridOffset.y; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }
  }, [originalImage, gridSize, gridOffset]);

  // Render preview
  useEffect(() => {
    if (processedData && previewRef.current) {
      const canvas = previewRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = Math.max(1, Math.floor(500 / Math.max(processedData.width, processedData.height)));
      
      canvas.width = processedData.width * scale;
      canvas.height = processedData.height * scale;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Checkerboard
      const checkSize = 10;
      for(let y=0; y<canvas.height; y+=checkSize) {
          for(let x=0; x<canvas.width; x+=checkSize) {
              ctx.fillStyle = ((x/checkSize + y/checkSize) % 2 === 0) ? '#e5e7eb' : '#ffffff'; // Light theme checkerboard
              ctx.fillRect(x, y, checkSize, checkSize);
          }
      }

      processedData.pixels.forEach((color, i) => {
        if (color === 'transparent') return;
        const x = (i % processedData.width) * scale;
        const y = Math.floor(i / processedData.width) * scale;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, scale, scale);
      });
    }
  }, [processedData]);

  const handleDownload = () => {
      if (!processedData) return;
      const canvas = document.createElement('canvas');
      canvas.width = processedData.width;
      canvas.height = processedData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      processedData.pixels.forEach((color, i) => {
        if (color === 'transparent') return;
        const x = i % processedData.width;
        const y = Math.floor(i / processedData.width);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });

      const link = document.createElement('a');
      link.download = 'pixel-art.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
  };

  // Grid Dragging Logic
  const handleGridMouseDown = (e: React.MouseEvent) => {
      setIsDraggingGrid(true);
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingGrid) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      if (gridOverlayRef.current) {
          const rect = gridOverlayRef.current.getBoundingClientRect();
          const scaleX = gridOverlayRef.current.width / rect.width;
          const scaleY = gridOverlayRef.current.height / rect.height;
          
          setGridOffset(prev => ({
              x: (prev.x + dx * scaleX) % gridSize,
              y: (prev.y + dy * scaleY) % gridSize
          }));
          setDragStart({ x: e.clientX, y: e.clientY });
      }
  };

  const handleGridMouseUp = () => {
      setIsDraggingGrid(false);
      if (originalImage) processImage(originalImage);
  };

  return (
    <TooltipProvider>
    <div className="w-full max-w-6xl flex flex-col gap-8">
      
      {/* AI Generation Section */}
      <Card className="w-full bg-zinc-900/50 border-zinc-800">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                  <Wand2 className="w-5 h-5 text-blue-500" />
                  Generate Pixel Art
              </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
              <Textarea 
                  placeholder="Describe your pixel art (e.g., 'A cute green slime monster')" 
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex gap-4">
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectValue placeholder="Resolution" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectItem value="8x8">8x8</SelectItem>
                      <SelectItem value="16x16">16x16</SelectItem>
                      <SelectItem value="32x32">32x32</SelectItem>
                      <SelectItem value="64x64">64x64</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !prompt}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                  >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
              </div>
          </CardContent>
      </Card>

      {/* Upload Area (if no image) */}
      {!originalImage && (
        <div 
          className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer
            ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}`}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="w-12 h-12 mb-4 text-zinc-500" />
          <h3 className="text-xl font-semibold mb-2 text-zinc-200">Upload Image</h3>
          <p className="text-zinc-500">or drag and drop</p>
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Editor Area */}
      {originalImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Original */}
          <div className="flex flex-col gap-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Original
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setOriginalImage(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8"
                    >
                        Remove
                    </Button>
                </CardHeader>
                <CardContent>
                    <div 
                        className="relative aspect-square w-full flex items-center justify-center bg-zinc-950 rounded-lg overflow-hidden cursor-move group border border-zinc-800"
                        onMouseDown={handleGridMouseDown}
                        onMouseMove={handleGridMouseMove}
                        onMouseUp={handleGridMouseUp}
                        onMouseLeave={handleGridMouseUp}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={originalImage.src} 
                            alt="Original" 
                            className="absolute max-w-full max-h-full object-contain pointer-events-none"
                        />
                        <canvas 
                            ref={gridOverlayRef}
                            className={`absolute max-w-full max-h-full object-contain pointer-events-none transition-opacity ${showGrid ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none backdrop-blur-sm">
                            Drag to adjust grid
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
               <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                       <Settings className="w-4 h-4" /> Settings
                   </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                   <div className="space-y-4">
                       <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                               <Label className="text-zinc-200">Grid Size</Label>
                               <Tooltip>
                                   <TooltipTrigger>
                                       <Info className="w-3 h-3 text-zinc-500" />
                                   </TooltipTrigger>
                                   <TooltipContent>
                                       <p>Size of each pixel block in the original image</p>
                                   </TooltipContent>
                               </Tooltip>
                           </div>
                           <span className="text-sm text-zinc-400 font-mono">{gridSize}px</span>
                       </div>
                       <Slider 
                           value={[gridSize]} 
                           min={2} 
                           max={50} 
                           step={1}
                           onValueChange={(vals) => setGridSize(vals[0])}
                           className="py-4"
                       />
                   </div>

                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                           <Label className="text-zinc-200">Always Show Grid</Label>
                           <Tooltip>
                               <TooltipTrigger>
                                   <Info className="w-3 h-3 text-zinc-500" />
                               </TooltipTrigger>
                               <TooltipContent>
                                   <p>Keep the grid overlay visible to help with alignment</p>
                               </TooltipContent>
                           </Tooltip>
                       </div>
                       <Switch 
                           checked={showGrid}
                           onCheckedChange={setShowGrid}
                       />
                   </div>

                   <div className="space-y-2">
                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                               <Label className="text-zinc-200">Grid Offset</Label>
                               <Tooltip>
                                   <TooltipTrigger>
                                       <Info className="w-3 h-3 text-zinc-500" />
                                   </TooltipTrigger>
                                   <TooltipContent>
                                       <p>Shift the grid to align with pixels. You can also drag on the image.</p>
                                   </TooltipContent>
                               </Tooltip>
                           </div>
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => setGridOffset({ x: 0, y: 0 })}
                               className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                           >
                               <RotateCcw className="w-3 h-3 mr-1" /> Reset
                           </Button>
                       </div>
                       
                       {/* Desktop Inputs */}
                       <div className="hidden md:grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <Label className="text-xs text-zinc-500">X Axis</Label>
                               <Input 
                                   type="number" 
                                   value={Math.round(gridOffset.x)} 
                                   onChange={(e) => setGridOffset(prev => ({ ...prev, x: Number(e.target.value) }))}
                                   className="bg-zinc-950 border-zinc-800 text-zinc-100"
                               />
                           </div>
                           <div className="space-y-2">
                               <Label className="text-xs text-zinc-500">Y Axis</Label>
                               <Input 
                                   type="number" 
                                   value={Math.round(gridOffset.y)} 
                                   onChange={(e) => setGridOffset(prev => ({ ...prev, y: Number(e.target.value) }))}
                                   className="bg-zinc-950 border-zinc-800 text-zinc-100"
                               />
                           </div>
                       </div>

                       {/* Mobile Sliders */}
                       <div className="md:hidden space-y-4 pt-2">
                           <div className="space-y-2">
                               <div className="flex justify-between">
                                   <Label className="text-xs text-zinc-500">X Axis</Label>
                                   <span className="text-xs text-zinc-400 font-mono">{Math.round(gridOffset.x)}px</span>
                               </div>
                               <Slider 
                                   value={[gridOffset.x]} 
                                   min={0} 
                                   max={gridSize} 
                                   step={1}
                                   onValueChange={(vals) => setGridOffset(prev => ({ ...prev, x: vals[0] }))}
                               />
                           </div>
                           <div className="space-y-2">
                               <div className="flex justify-between">
                                   <Label className="text-xs text-zinc-500">Y Axis</Label>
                                   <span className="text-xs text-zinc-400 font-mono">{Math.round(gridOffset.y)}px</span>
                               </div>
                               <Slider 
                                   value={[gridOffset.y]} 
                                   min={0} 
                                   max={gridSize} 
                                   step={1}
                                   onValueChange={(vals) => setGridOffset(prev => ({ ...prev, y: vals[0] }))}
                               />
                           </div>
                       </div>
                   </div>

                   <Button 
                       onClick={() => processImage(originalImage)}
                       disabled={isProcessing}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                   >
                       {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                       Reprocess
                   </Button>
               </CardContent>
            </Card>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-4">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Converted Result
                    </CardTitle>
                    {processedData && (
                        <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                            {processedData.width}x{processedData.height}
                        </span>
                    )}
               </CardHeader>
               <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-lg overflow-hidden min-h-[400px] border border-zinc-800">
                     <canvas ref={previewRef} className="max-w-full max-h-full object-contain image-pixelated" />
                  </div>

                  <Button 
                    onClick={handleDownload}
                    disabled={!processedData}
                    className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Pixel Art
                  </Button>
               </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
