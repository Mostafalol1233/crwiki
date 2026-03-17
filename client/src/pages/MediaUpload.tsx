import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Server, Globe, Copy, Check, Image as ImageIcon, X, File as FileIcon } from "lucide-react";

export default function MediaUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadMethod, setUploadMethod] = useState<"server" | "cloudinary">("cloudinary");
  const [customName, setCustomName] = useState("");
  const [bucket, setBucket] = useState("uploads");

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setUploadedUrls([]);
      setProgress({});
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processUrl = async (url: string) => {
    if (!url) return null;
    try {
      if (/^data:image\/(jpeg|png|gif);base64,/i.test(url)) {
        const arr = url.split(",");
        const mime = arr[0].match(/data:(.*?);base64/i)?.[1] || "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const ext = mime.includes("png") ? "png" : mime.includes("gif") ? "gif" : "jpg";
        return new File([u8arr], `${customName || "upload"}.${ext}`, { type: mime });
      } else if (/^https?:\/\//i.test(url)) {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status}`);
        const ct = resp.headers.get("content-type") || "";
        if (!/(image\/(jpeg|png|gif)|video\/mp4|application\/pdf)/i.test(ct)) throw new Error("Unsupported remote type");
        const blob = await resp.blob();
        const ext = ct.includes("png") ? "png" : ct.includes("gif") ? "gif" : ct.includes("mp4") ? "mp4" : ct.includes("pdf") ? "pdf" : "jpg";
        return new File([blob], `${customName || "upload"}.${ext}`, { type: ct });
      }
    } catch (e) {
      console.error("URL processing error", e);
      throw e;
    }
    return null;
  };

  const uploadSingleFile = async (file: File, index: number) => {
    const fileId = `${index}-${file.name}`;
    try {
      if (uploadMethod === "server") {
        const tokRes = await fetch("/api/security/csrf-token");
        const tokJson = await tokRes.json();
        const token = tokJson?.csrfToken || "";
        const authToken = localStorage.getItem("adminToken") || localStorage.getItem("auth_token") || localStorage.getItem("token") || "";

        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", bucket);
        // Only use custom name if single file
        if (files.length === 1 && customName) fd.append("customName", customName);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/images/upload", true);
        if (token) xhr.setRequestHeader("X-CSRF-Token", token);
        if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
             const pct = Math.round((e.loaded / e.total) * 100);
             setProgress(prev => ({ ...prev, [fileId]: pct }));
          }
        };

        const res: any = await new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json: async () => JSON.parse(xhr.responseText || "{}") });
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(fd);
        });

        const data = await res.json();
        const url = data?.domainUrl || data?.domain_url || data?.secure_url || "";
        if (!res.ok || !url) throw new Error(data?.error || "Upload failed");
        return url;

      } else {
        // Cloudinary (Custom Domain Proxy)
        const fd = new FormData();
        fd.append("image", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload-image", true);
        const token = localStorage.getItem("adminToken") || localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(prev => ({ ...prev, [fileId]: pct }));
          }
        };

        const res: any = await new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: async () => xhr.responseText });
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(fd);
        });

        const rawText = await res.text();
        let url = "";
        let parsed: any = null;
        try {
          parsed = JSON.parse(rawText);
          const firstResult = Array.isArray(parsed?.results) ? parsed.results.find((r: any) => r?.ok) : null;
          url =
            parsed?.domainUrl ||
            parsed?.domain_url ||
            parsed?.url ||
            parsed?.file ||
            parsed?.secure_url ||
            firstResult?.domainUrl ||
            firstResult?.domain_url ||
            firstResult?.url ||
            firstResult?.secure_url ||
            "";
          if (!url && Array.isArray(parsed?.results) && parsed.results.length > 0) {
            const firstErr = parsed.results.find((r: any) => !r?.ok && r?.error)?.error;
            if (firstErr) throw new Error(firstErr);
          }
        } catch (jsonErr) {
          url = rawText;
        }

        if (!res.ok) {
          const errMsg = parsed?.error || parsed?.message || `Upload failed (status ${res.status})`;
          throw new Error(errMsg);
        }
        if (!url || !url.startsWith("http")) throw new Error(parsed?.error || "Upload failed");
        return url.trim();
      }
    } catch (e: any) {
      console.error(`Upload failed for ${file.name}:`, e);
      toast({ title: "Upload failed", description: `${file.name}: ${e.message}`, variant: "destructive" });
      return null;
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setUploadedUrls([]);
      setProgress({});

      let filesToUpload = [...files];
      let processedFile: any = null;
      if (filesToUpload.length === 0 && urlInput) {
        try {
          processedFile = await processUrl(urlInput);
          if (processedFile) filesToUpload = [processedFile];
        } catch (err: any) {
          console.error("[MediaUpload] Error processing URL", {
            file: "MediaUpload.tsx",
            line: 153,
            error: err.message,
            stack: err.stack
          });
          processedFile = null; // Fallback value
        }
      }

      if (filesToUpload.length === 0) {
        toast({ title: "No file selected", description: "Please select files or enter a URL", variant: "destructive" });
        return;
      }

      const results = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const url = await uploadSingleFile(filesToUpload[i], i);
        if (url) results.push(url);
      }

      if (results.length > 0) {
        setUploadedUrls(results);
        toast({ title: "Success", description: `Uploaded ${results.length} files` });
        onUploadSuccess?.();
        setFiles([]);
        setUrlInput("");
      }

    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "URL copied to clipboard" });
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Media Uploader</CardTitle>
          <CardDescription>Unified upload interface for server and Cloudinary media storage</CardDescription>
          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as any)} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="server" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Local Server
              </TabsTrigger>
              <TabsTrigger value="cloudinary" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Cloudinary / Custom Domain
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                   onClick={() => document.getElementById('file-upload')?.click()}>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={pickFiles} 
                  accept="image/*,video/*,audio/*,application/pdf"
                  multiple
                />
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Click to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Or enter URL (Single file)</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={files.length > 0}
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {uploadMethod === "server" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bucket / Folder</label>
                    <Input 
                      placeholder="e.g. events, news" 
                      value={bucket} 
                      onChange={(e) => setBucket(e.target.value)} 
                    />
                  </div>
                  {files.length <= 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom Name (Optional)</label>
                      <Input 
                        placeholder="e.g. my-image" 
                        value={customName} 
                        onChange={(e) => setCustomName(e.target.value)} 
                      />
                    </div>
                  )}
                </>
              )}
              
              {uploadMethod === "cloudinary" && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Custom Domain Upload
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Uploads to Cloudinary (if configured) and serves via your custom domain.
                    If Cloudinary is unavailable, it falls back to local storage automatically.
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleUpload} 
                disabled={uploading || (files.length === 0 && !urlInput)}
              >
                {uploading ? `Uploading ${files.length > 0 ? files.length : 1} file(s)...` : "Start Upload"}
              </Button>

              {uploading && files.map((f, i) => {
                 const fileId = `${i}-${f.name}`;
                 const pct = progress[fileId] || 0;
                 return (
                   <div key={fileId} className="space-y-1">
                     <div className="flex justify-between text-xs">
                       <span className="truncate max-w-[70%]">{f.name}</span>
                       <span>{pct}%</span>
                     </div>
                     <Progress value={pct} />
                   </div>
                 );
              })}
              {uploading && files.length === 0 && urlInput && (
                 <div className="space-y-1">
                   <Progress value={Object.values(progress)[0] || 0} />
                 </div>
              )}
            </div>
          </div>

          {uploadedUrls.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Upload Complete ({uploadedUrls.length})
                </span>
                <Badge variant={uploadMethod === "server" ? "default" : "secondary"}>
                  {uploadMethod === "server" ? "Server" : "Cloudinary"}
                </Badge>
              </div>
              
              <div className="grid gap-2">
                {uploadedUrls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center p-2 bg-muted/50 rounded-lg border">
                    <div className="flex-1 min-w-0">
                       <Input value={url} readOnly className="h-8" />
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {(url.match(/\.(jpeg|jpg|gif|png)$/i) || uploadMethod === 'server') && (
                       <div className="h-8 w-8 rounded overflow-hidden bg-background border flex-shrink-0">
                         <img src={url} alt="Preview" className="w-full h-full object-cover" />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
