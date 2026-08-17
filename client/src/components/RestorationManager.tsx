import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RotateCw, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";

export default function RestorationManager() {
  const { toast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);

  const handleRestore = async () => {
    if (!window.confirm("This will restore all historical events and grave modes. Continue?")) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await apiRequest("/api/admin/restore-events", "POST", {});
      
      toast({
        title: "Restoration successful",
        description: response.message || "All events and graves have been restored!",
      });

      // Verify after restoration
      setTimeout(() => handleVerify(), 1000);
    } catch (error: any) {
      toast({
        title: "Restoration failed",
        description: error.message || "Failed to restore events",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await apiRequest("/api/admin/verify-restoration", "GET");
      
      if (response.success) {
        setVerificationData(response);
        toast({
          title: "Verification complete",
          description: `Database contains ${response.database.events} events and ${response.database.modes} modes`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify database state",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const loadRecoveryOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const response = await apiRequest("/api/admin/recovery-overview", "GET");
      setOverviewData(response);
    } catch (error: any) {
      toast({
        title: "Recovery snapshot failed",
        description: error.message || "Failed to load content recovery overview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOverview(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCw className="w-5 h-5" />
          Database Restoration
        </CardTitle>
        <CardDescription>
          Restore all previous events, graves, and game modes from backup data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restoration Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleRestore}
              disabled={isRestoring || isVerifying || isLoadingOverview}
              variant="default"
              size="lg"
              className="flex-1"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Restore Events & Graves
                </>
              )}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isRestoring || isVerifying || isLoadingOverview}
              variant="outline"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Use this area to restore historical data and preview your old pages quickly (events, posts, news, announcements, chat users, admins, and settings status).
          </p>
          <div>
            <Button
              onClick={loadRecoveryOverview}
              disabled={isRestoring || isVerifying || isLoadingOverview}
              variant="secondary"
              size="sm"
            >
              {isLoadingOverview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Snapshot...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Load Recovery Snapshot
                </>
              )}
            </Button>
          </div>
        </div>

        {overviewData?.success && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Recovery Snapshot (All Core Sections)
            </h3>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">{overviewData.counts.posts}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{overviewData.counts.events}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">News</p>
                <p className="text-2xl font-bold">{overviewData.counts.news}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Custom Pages</p>
                <p className="text-2xl font-bold">{overviewData.counts.customPages}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Global Announcements</p>
                <p className="text-2xl font-bold">{overviewData.counts.globalAnnouncements}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Seller Announcements</p>
                <p className="text-2xl font-bold">{overviewData.counts.sellerAnnouncements}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{overviewData.counts.admins}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Chat Users</p>
                <p className="text-2xl font-bold">{overviewData.counts.chatUsers}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="border rounded-lg p-3">
                <p className="font-medium">Settings Status</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Site settings configured: {overviewData.settings.siteSettingsConfigured ? "Yes" : "No"}</li>
                  <li>Chat registration enabled: {overviewData.settings.chatRegistrationEnabled ? "Open" : "Closed"}</li>
                </ul>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium">Quick Admin Checklist</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Events & News tab → verify restored event history</li>
                  <li>Posts tab → confirm old posts render and open links</li>
                  <li>Announcements tab → confirm active banners</li>
                  <li>Chat Settings tab → verify users and registration mode</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="border rounded-lg p-3">
                <p className="font-medium mb-2">Latest Posts Preview</p>
                <div className="space-y-2">
                  {(overviewData.previews?.posts || []).map((item: any) => (
                    <a key={item.id} href={item.publicUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm hover:underline">
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium mb-2">Latest Events Preview</p>
                <div className="space-y-2">
                  {(overviewData.previews?.events || []).map((item: any) => (
                    <a key={item.id} href={item.publicUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm hover:underline">
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="border rounded-lg p-3">
                <p className="font-medium mb-2">Latest News Preview</p>
                <div className="space-y-2">
                  {(overviewData.previews?.news || []).map((item: any) => (
                    <a key={item.id} href={item.publicUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm hover:underline">
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium mb-2">Latest Custom Pages Preview</p>
                <div className="space-y-2">
                  {(overviewData.previews?.customPages || []).map((item: any) => (
                    <a key={item.id} href={item.publicUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm hover:underline">
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationData && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Database Status
            </h3>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold text-blue-600">
                  {verificationData.database.events}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Game Modes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {verificationData.database.modes}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Grave Modes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {verificationData.database.graveModes}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Event Types</p>
                <p className="text-2xl font-bold text-green-600">
                  {verificationData.database.eventTypes.length}
                </p>
              </div>
            </div>

            {/* Grave Modes List */}
            {verificationData.graveModesRestored.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Grave/Zombie Modes Restored:
                </p>
                <div className="flex flex-wrap gap-2">
                  {verificationData.graveModesRestored.map((mode: string) => (
                    <Badge key={mode} variant="secondary">
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Event Types */}
            {verificationData.database.eventTypes.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Event Types:</p>
                <div className="flex flex-wrap gap-2">
                  {verificationData.database.eventTypes.map((type: string) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Events */}
            {verificationData.recentEvents.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Latest Events:</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {verificationData.recentEvents.map((event: any) => (
                    <div key={event.id} className="bg-gray-50 p-2 rounded text-sm">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.type} • {event.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          <p className="font-semibold mb-1">ℹ️ What gets restored:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>21 historical events (announcements, seasonal, maintenance, etc.)</li>
            <li>3 Grave/Zombie game modes (Metal Rage, Evil Den, Forbidden Zone)</li>
            <li>All associated event metadata (dates, types, images, descriptions)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
