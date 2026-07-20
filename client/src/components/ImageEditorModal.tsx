import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Crop, 
  Maximize, 
  Palette, 
  Wand2, 
  RotateCw, 
  Check, 
  X, 
  Download, 
  Image as ImageIcon,
  Square,
  Circle,
  Type
} from "lucide-react";
import imageCompression from 'browser-image-compression';

export interface ImageEditorConfig {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  allowedTypes?: string[];
  quality?: number;
  initialImage?: string;
}

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (newSrc: string) => void;
  toast: any;
  config?: ImageEditorConfig;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  toast,
  config = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    quality: 0.9
  }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [blur, setBlur] = useState(0);
  const [invert, setInvert] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#000000");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shape, setShape] = useState<'rect' | 'circle'>('rect');
  const [isResizing, setIsResizing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (isOpen && imageSrc) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageSrc;
      image.onload = () => {
        setImg(image);
        setWidth(image.width);
        setHeight(image.height);
        setCrop({ x: 0, y: 0, width: image.width, height: image.height });
        draw(image);
        setHistory([]);
        setHistoryIndex(-1);
      };
    }
  }, [isOpen, imageSrc]);

  const captureState = () => {
    const snap: any = {
      brightness, contrast, saturate, grayscale, sepia, blur, invert, hueRotate,
      rotation, borderRadius, borderWidth, borderColor, width, height, shape,
      crop: { ...crop },
      imgDataUrl: canvasRef.current ? canvasRef.current.toDataURL() : null
    };
    return snap;
  };

  const pushHistory = () => {
    const snap = captureState();
    const next = history.slice(0, historyIndex + 1).concat(snap).slice(-20);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  };

  const restoreState = (snap: any) => {
    setBrightness(snap.brightness);
    setContrast(snap.contrast);
    setSaturate(snap.saturate);
    setGrayscale(snap.grayscale);
    setSepia(snap.sepia);
    setBlur(snap.blur);
    setInvert(snap.invert);
    setHueRotate(snap.hueRotate);
    setRotation(snap.rotation);
    setBorderRadius(snap.borderRadius);
    setBorderWidth(snap.borderWidth);
    setBorderColor(snap.borderColor);
    setWidth(snap.width);
    setHeight(snap.height);
    setShape(snap.shape);
    setCrop({ ...snap.crop });
    if (snap.imgDataUrl) {
      const newImg = new Image();
      newImg.src = snap.imgDataUrl;
      newImg.onload = () => {
        setImg(newImg);
        draw(newImg);
      };
    } else {
      draw();
    }
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    const snap = history[idx];
    if (snap) restoreState(snap);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    const snap = history[idx];
    if (snap) restoreState(snap);
  };

  const draw = (image: HTMLImageElement | null = img) => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on image and rotation
    const isRotated = rotation % 180 !== 0;
    canvas.width = isRotated ? image.height : image.width;
    canvas.height = isRotated ? image.width : image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px) invert(${invert}%) hue-rotate(${hueRotate}deg)`;
    
    // Apply rotation and draw
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    
    // Reset transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const handleApplyCrop = () => {
    if (!img || !canvasRef.current) return;
    pushHistory();
    
    // Create a temporary canvas to hold the current filtered/rotated image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(canvasRef.current, 0, 0);

    // Update main canvas to cropped size
    canvasRef.current.width = crop.width;
    canvasRef.current.height = crop.height;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(tempCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    
    // Update state to match new image dimensions
    setWidth(crop.width);
    setHeight(crop.height);
    setIsCropping(false);
    
    // Update the base image to the cropped version so further edits work on the cropped version
    const croppedDataUrl = canvasRef.current.toDataURL();
    const newImg = new Image();
    newImg.src = croppedDataUrl;
    newImg.onload = () => {
      setImg(newImg);
      setRotation(0); // Reset rotation as it's baked in
      setBrightness(100);
      setContrast(100);
      setSaturate(100);
      setGrayscale(0);
      setSepia(0);
      setBlur(0);
      setInvert(0);
      setHueRotate(0);
      pushHistory();
    };
  };

  const handleCropMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    if (!isCropping) return;
    e.stopPropagation();
    setIsDraggingCrop(true);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !isCropping || !canvasRef.current) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const canvas = canvasRef.current;
    
    setCrop(prev => {
      let { x, y, width, height } = { ...prev };
      
      if (!activeHandle) {
        // Dragging the whole area
        x = Math.max(0, Math.min(canvas.width - width, x + dx));
        y = Math.max(0, Math.min(canvas.height - height, y + dy));
      } else {
        // Resizing via handles
        if (activeHandle.includes('e')) width = Math.max(20, Math.min(canvas.width - x, width + dx));
        if (activeHandle.includes('s')) height = Math.max(20, Math.min(canvas.height - y, height + dy));
        if (activeHandle.includes('w')) {
          const newX = Math.max(0, Math.min(x + width - 20, x + dx));
          width += (x - newX);
          x = newX;
        }
        if (activeHandle.includes('n')) {
          const newY = Math.max(0, Math.min(y + height - 20, y + dy));
          height += (y - newY);
          y = newY;
        }
      }
      
      return { x, y, width, height };
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
    setIsResizing(false);
    setActiveHandle(null);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (isCropping) return;
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCrop) {
      handleCropMouseMove(e);
    } else if (isResizing) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      let newWidth = width;
      let newHeight = height;
      
      if (activeHandle?.includes('e')) newWidth = Math.max(50, width + dx);
      if (activeHandle?.includes('s')) newHeight = Math.max(50, height + dy);
      
      if (aspectRatio && img) {
        if (activeHandle?.includes('e')) {
          newHeight = Math.round((newWidth / img.width) * img.height);
        } else if (activeHandle?.includes('s')) {
          newWidth = Math.round((newHeight / img.height) * img.width);
        }
      }
      
      setWidth(newWidth);
      setHeight(newHeight);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    draw();
  }, [brightness, contrast, saturate, grayscale, sepia, blur, invert, hueRotate, rotation]);

  const handleResizeWidth = (val: string) => {
    const newWidth = parseInt(val) || 0;
    pushHistory();
    setWidth(newWidth);
    if (aspectRatio && img) {
      setHeight(Math.round((newWidth / img.width) * img.height));
    }
  };

  const handleResizeHeight = (val: string) => {
    const newHeight = parseInt(val) || 0;
    pushHistory();
    setHeight(newHeight);
    if (aspectRatio && img) {
      setWidth(Math.round((newHeight / img.height) * img.width));
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    toast({ title: "Processing and uploading image..." });

    try {
      // 1. Create a temporary canvas for resizing and borders
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const fctx = finalCanvas.getContext('2d');
      if (!fctx) throw new Error("Could not get context");

      // Draw with border radius and shape
      fctx.save();
      
      if (shape === 'circle') {
        fctx.beginPath();
        fctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        fctx.clip();
      } else if (borderRadius > 0) {
        const r = Math.min(borderRadius, width / 2, height / 2);
        fctx.beginPath();
        fctx.moveTo(r, 0);
        fctx.lineTo(width - r, 0);
        fctx.quadraticCurveTo(width, 0, width, r);
        fctx.lineTo(width, height - r);
        fctx.quadraticCurveTo(width, height, width - r, height);
        fctx.lineTo(r, height);
        fctx.quadraticCurveTo(0, height, 0, height - r);
        fctx.lineTo(0, r);
        fctx.quadraticCurveTo(0, 0, r, 0);
        fctx.closePath();
        fctx.clip();
      }

      // Draw the edited image from main canvas to final canvas with resizing
      fctx.drawImage(canvasRef.current, 0, 0, width, height);
      fctx.restore();

      // Draw border if needed
      if (borderWidth > 0) {
        fctx.strokeStyle = borderColor;
        fctx.lineWidth = borderWidth;
        if (shape === 'circle') {
          fctx.beginPath();
          fctx.arc(width / 2, height / 2, (Math.min(width, height) / 2) - borderWidth / 2, 0, Math.PI * 2);
          fctx.stroke();
        } else if (borderRadius > 0) {
          const r = Math.min(borderRadius, width / 2, height / 2);
          fctx.beginPath();
          fctx.moveTo(r, 0);
          fctx.lineTo(width - r, 0);
          fctx.quadraticCurveTo(width, 0, width, r);
          fctx.lineTo(width, height - r);
          fctx.quadraticCurveTo(width, height, width - r, height);
          fctx.lineTo(r, height);
          fctx.quadraticCurveTo(0, height, 0, height - r);
          fctx.lineTo(0, r);
          fctx.quadraticCurveTo(0, 0, r, 0);
          fctx.stroke();
        } else {
          fctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
        }
      }

      // 2. Export to Blob (Use PNG if we have transparency)
      const mimeType = (shape === 'circle' || borderRadius > 0) ? 'image/png' : 'image/jpeg';
      
      // Validate if type is allowed
      if (config.allowedTypes && !config.allowedTypes.includes(mimeType)) {
        throw new Error(`Mime type ${mimeType} is not allowed by configuration`);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        finalCanvas.toBlob((b) => resolve(b), mimeType, config.quality || 0.9);
      });

      if (!blob) throw new Error("Blob creation failed");

      // 3. Compress if needed
      const options = {
        maxSizeMB: config.maxSizeMB || 1,
        maxWidthOrHeight: config.maxWidthOrHeight || 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(new File([blob], `edited-image.${mimeType === 'image/png' ? 'png' : 'jpg'}`, { type: mimeType }), options);

      // 4. Upload to Supabase Storage
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const nameBase = `edited-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;

      const { uploadToSupabase } = await import('@/lib/uploadToSupabase');
      const nextUrl = await uploadToSupabase(compressedFile, 'editor', nameBase);
      if (nextUrl) {
        onSave(nextUrl);
        toast({ title: "Image updated successfully" });
        onClose();
      } else {
        const base64 = finalCanvas.toDataURL(mimeType, 0.9);
        onSave(base64);
        toast({ title: "Image updated (saved as Base64)" });
        onClose();
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      toast({ title: "Failed to save image", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Professional Image Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-muted/30">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-background flex flex-col overflow-y-auto max-h-[30vh] md:max-h-full">
            <Tabs defaultValue="filters" className="w-full h-full flex flex-col">
              <TabsList className="grid grid-cols-4 rounded-none border-b h-12">
                <TabsTrigger value="filters" title="Filters"><Wand2 className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="crop" title="Crop"><Crop className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="resize" title="Resize"><Maximize className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="styles" title="Styles"><Palette className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="filters" className="p-4 space-y-4 m-0">
                <div className="space-y-2">
                  <Label>Brightness ({brightness}%)</Label>
                  <Slider value={[brightness]} min={0} max={200} step={1} onValueChange={([v]) => setBrightness(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Contrast ({contrast}%)</Label>
                  <Slider value={[contrast]} min={0} max={200} step={1} onValueChange={([v]) => setContrast(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Saturation ({saturate}%)</Label>
                  <Slider value={[saturate]} min={0} max={200} step={1} onValueChange={([v]) => setSaturate(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Grayscale ({grayscale}%)</Label>
                  <Slider value={[grayscale]} min={0} max={100} step={1} onValueChange={([v]) => setGrayscale(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Sepia ({sepia}%)</Label>
                  <Slider value={[sepia]} min={0} max={100} step={1} onValueChange={([v]) => setSepia(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Blur ({blur}px)</Label>
                  <Slider value={[blur]} min={0} max={10} step={0.5} onValueChange={([v]) => setBlur(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Invert ({invert}%)</Label>
                  <Slider value={[invert]} min={0} max={100} step={1} onValueChange={([v]) => setInvert(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Hue Rotate ({hueRotate}deg)</Label>
                  <Slider value={[hueRotate]} min={0} max={360} step={1} onValueChange={([v]) => setHueRotate(v)} />
                </div>
                <Button variant="outline" className="w-full gap-2 mt-4" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" /> Rotate 90°
                </Button>
              </TabsContent>

              <TabsContent value="crop" className="p-4 space-y-4 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Cropping</Label>
                    <Switch checked={isCropping} onCheckedChange={(val) => {
                      setIsCropping(val);
                      if (val && canvasRef.current) {
                        setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: canvasRef.current.height });
                      }
                    }} />
                  </div>
                  
                  {isCropping && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">X</Label>
                          <Input type="number" value={Math.round(crop.x)} onChange={(e) => setCrop({...crop, x: parseInt(e.target.value) || 0})} size={1} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Y</Label>
                          <Input type="number" value={Math.round(crop.y)} onChange={(e) => setCrop({...crop, y: parseInt(e.target.value) || 0})} size={1} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Width</Label>
                          <Input type="number" value={Math.round(crop.width)} onChange={(e) => setCrop({...crop, width: parseInt(e.target.value) || 0})} size={1} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height</Label>
                          <Input type="number" value={Math.round(crop.height)} onChange={(e) => setCrop({...crop, height: parseInt(e.target.value) || 0})} size={1} className="h-8" />
                        </div>
                      </div>
                      
                      <Button className="w-full gap-2" onClick={handleApplyCrop}>
                        <Check className="h-4 w-4" /> Apply Crop
                      </Button>
                      
                      <div className="pt-4 space-y-2">
                        <Label className="text-xs text-muted-foreground">Quick Presets</Label>
                  <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: canvasRef.current.width })}>1:1 Square</Button>
                          <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: (canvasRef.current.width * 9) / 16 })}>16:9</Button>
                    <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: Math.round((canvasRef.current.width * 3) / 4) })}>4:3</Button>
                    <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: Math.round((canvasRef.current.width * 2) / 3) })}>3:2</Button>
                    <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: Math.round((canvasRef.current.width * 1) / 2) })}>2:1</Button>
                    <Button variant="outline" size="sm" onClick={() => canvasRef.current && setCrop({ x: 0, y: 0, width: canvasRef.current.width, height: canvasRef.current.height })}>Free</Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded border border-dashed">
                    Tip: When enabled, drag the overlay on the image to select the crop area.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resize" className="p-4 space-y-4 m-0">
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <Input type="number" value={width} onChange={(e) => handleResizeWidth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input type="number" value={height} onChange={(e) => handleResizeHeight(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="aspect" checked={aspectRatio} onChange={(e) => setAspectRatio(e.target.checked)} />
                  <Label htmlFor="aspect" className="cursor-pointer">Maintain aspect ratio</Label>
                </div>
                <div className="pt-4 space-y-2">
                  <Label>Quick Resize</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => img && handleResizeWidth((img.width * 0.5).toString())}>50%</Button>
                    <Button variant="outline" size="sm" onClick={() => img && handleResizeWidth((img.width * 0.75).toString())}>75%</Button>
                    <Button variant="outline" size="sm" onClick={() => img && handleResizeWidth((img.width * 1.5).toString())}>150%</Button>
                    <Button variant="outline" size="sm" onClick={() => img && handleResizeWidth((img.width * 2).toString())}>200%</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { setWidth(512); setHeight(512); }}>512×512</Button>
                    <Button variant="outline" size="sm" onClick={() => { setWidth(1280); setHeight(720); }}>1280×720</Button>
                    <Button variant="outline" size="sm" onClick={() => { setWidth(1920); setHeight(1080); }}>1920×1080</Button>
                    <Button variant="outline" size="sm" onClick={() => { setWidth(1080); setHeight(1080); }}>Instagram 1080</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="styles" className="p-4 space-y-4 m-0">
                <div className="space-y-2">
                  <Label>Image Shape</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={shape === 'rect' ? 'default' : 'outline'} 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setShape('rect')}
                    >
                      <Square className="h-4 w-4" /> Rectangle
                    </Button>
                    <Button 
                      variant={shape === 'circle' ? 'default' : 'outline'} 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setShape('circle')}
                    >
                      <Circle className="h-4 w-4" /> Circle
                    </Button>
                  </div>
                </div>

                {shape === 'rect' && (
                  <div className="space-y-2">
                    <Label>Border Radius ({borderRadius}px)</Label>
                    <Slider value={[borderRadius]} min={0} max={100} step={1} onValueChange={([v]) => setBorderRadius(v)} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Border Width ({borderWidth}px)</Label>
                  <Slider value={[borderWidth]} min={0} max={20} step={1} onValueChange={([v]) => setBorderWidth(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-12 p-1 h-10" />
                    <Input type="text" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 p-8 flex items-center justify-center overflow-auto relative" ref={containerRef}>
            <div 
              className="relative shadow-2xl bg-white" 
              style={{ 
                borderRadius: shape === 'circle' ? '50%' : `${borderRadius}px`, 
                border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
                overflow: 'hidden',
                transition: 'all 0.2s ease-out',
                cursor: isCropping ? 'crosshair' : 'default',
                aspectRatio: shape === 'circle' ? '1/1' : 'auto'
              }}
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleGlobalMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              <canvas ref={canvasRef} className="max-w-full max-h-full object-contain block" />
              
              {/* Resize Handles (Visible when not cropping) */}
              {!isCropping && (
                <>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white rounded-sm cursor-se-resize z-20 shadow-sm" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-primary/50 border border-white rounded-sm cursor-e-resize z-20" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary/50 border border-white rounded-sm cursor-s-resize z-20" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
                </>
              )}

              {isCropping && (
                 <div 
                   className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10"
                   style={{
                     left: `${crop.x}px`,
                     top: `${crop.y}px`,
                     width: `${crop.width}px`,
                     height: `${crop.height}px`,
                     cursor: 'move'
                   }}
                   onMouseDown={(e) => handleCropMouseDown(e, null)}
                 >
                   <div className="absolute inset-0 border border-black/20 pointer-events-none">
                     {/* Grid lines */}
                     <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/30" />
                     <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/30" />
                     <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/30" />
                     <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/30" />
                   </div>
                   
                   {/* Resize Handles */}
                   <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-black rounded-full cursor-nw-resize" onMouseDown={(e) => handleCropMouseDown(e, 'nw')} />
                   <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-black rounded-full cursor-ne-resize" onMouseDown={(e) => handleCropMouseDown(e, 'ne')} />
                   <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-black rounded-full cursor-sw-resize" onMouseDown={(e) => handleCropMouseDown(e, 'sw')} />
                   <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-black rounded-full cursor-se-resize" onMouseDown={(e) => handleCropMouseDown(e, 'se')} />
                   
                   <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-black rounded-full cursor-w-resize" onMouseDown={(e) => handleCropMouseDown(e, 'w')} />
                   <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-black rounded-full cursor-e-resize" onMouseDown={(e) => handleCropMouseDown(e, 'e')} />
                   <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-black rounded-full cursor-n-resize" onMouseDown={(e) => handleCropMouseDown(e, 'n')} />
                   <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-black rounded-full cursor-s-resize" onMouseDown={(e) => handleCropMouseDown(e, 's')} />
                 </div>
               )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t gap-2 bg-background">
          <Button variant="outline" onClick={handleUndo} disabled={historyIndex <= 0 || isProcessing}>
            Undo
          </Button>
          <Button variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isProcessing}>
            Redo
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !img}>
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Apply & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
