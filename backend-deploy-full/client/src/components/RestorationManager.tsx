import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RotateCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function RestorationManager() {
  const { toast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);

  const handleRestore = async () => {
    if (!window.confirm("⚠️ This will restore all historical events and grave modes. Continue?")) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await apiRequest("/api/admin/restore-events", "POST", {});
      
      toast({
        title: "✅ Restoration Successful",
        description: response.message || "All events and graves have been restored!",
      });

      // Verify after restoration
      setTimeout(() => handleVerify(), 1000);
    } catch (error: any) {
      toast({
        title: "❌ Restoration Failed",
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
          title: "✅ Verification Complete",
          description: `Database contains ${response.database.events} events and ${response.database.modes} modes`,
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Verification Failed",
        description: error.message || "Failed to verify database state",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
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
              disabled={isRestoring || isVerifying}
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
              disabled={isRestoring || isVerifying}
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
            Click "Restore" to recover all historical events and grave modes. Use "Verify" to check database status.
          </p>
        </div>

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
