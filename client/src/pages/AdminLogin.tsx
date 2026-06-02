import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, RefreshCcw, ShieldCheck, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Orb from "@/components/Orb";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [challengeSeed, setChallengeSeed] = useState(() => Math.floor(Math.random() * 10_000));
  const [adminChallengeAnswer, setAdminChallengeAnswer] = useState("");
  const [superChallengeAnswer, setSuperChallengeAnswer] = useState("");

  const adminChallenge = useMemo(() => {
    const left = (challengeSeed % 7) + 3;
    const right = (challengeSeed % 5) + 2;
    return { left, right, answer: left + right };
  }, [challengeSeed]);

  const superChallenge = useMemo(() => {
    const left = (challengeSeed % 8) + 4;
    const right = (challengeSeed % 6) + 3;
    return { left, right, answer: left + right };
  }, [challengeSeed]);

  const resetChallenges = () => {
    setChallengeSeed(Math.floor(Math.random() * 10_000));
    setAdminChallengeAnswer("");
    setSuperChallengeAnswer("");
  };

  const handleAdminLogin = async () => {
    if (!username || !adminPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    if (Number(adminChallengeAnswer) !== adminChallenge.answer) {
      toast({
        title: "Verification failed",
        description: "Please solve the verification challenge before logging in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { adminLogin } = await import("@/lib/supabaseAdmin");
      const { token, admin } = await adminLogin({ username, password: adminPassword });
      localStorage.setItem("adminToken", token);
      // server returns roles array; store single role for legacy client usage
      const role = Array.isArray(admin.roles) && admin.roles.length ? admin.roles[0] : (admin.role || "admin");
      localStorage.setItem("adminRole", role);
      localStorage.setItem("adminUsername", admin.username || "");
      // persist permissions so Admin page can gate sections per admin
      try {
        localStorage.setItem("adminPermissions", JSON.stringify(admin.permissions || {}));
      } catch {
        localStorage.setItem("adminPermissions", "{}");
      }
      resetChallenges();
      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    if (!password) {
      toast({
        title: "Missing password",
        description: "Please enter the super admin password",
        variant: "destructive",
      });
      return;
    }

    if (Number(superChallengeAnswer) !== superChallenge.answer) {
      toast({
        title: "Verification failed",
        description: "Please solve the verification challenge before logging in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { adminLogin } = await import("@/lib/supabaseAdmin");
      const { token, admin } = await adminLogin({ password });
      localStorage.setItem("adminToken", token);
      // server returns roles array; store single role for legacy client usage
      const role = Array.isArray(admin.roles) && admin.roles.length ? admin.roles[0] : (admin.role || "super_admin");
      localStorage.setItem("adminRole", role);
      localStorage.setItem("adminUsername", "super_admin");
      try {
        localStorage.setItem("adminPermissions", JSON.stringify(admin.permissions || {}));
      } catch {
        localStorage.setItem("adminPermissions", "{}");
      }
      resetChallenges();
      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative z-10">
      <Orb hoverIntensity={0.5} rotateOnHover={true} hue={220}>
      <Card className="w-full max-w-md mx-4 auth-box">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Choose your login method
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-login-type">
              <TabsTrigger value="admin" data-testid="tab-admin-login">
                <User className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="super" data-testid="tab-super-login">
                <Lock className="h-4 w-4 mr-2" />
                Super Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-4 mt-4" data-testid="content-admin-login">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  data-testid="input-admin-username"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  data-testid="input-admin-password"
                />
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Human verification</span>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={resetChallenges}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">Solve: {adminChallenge.left} + {adminChallenge.right}</p>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter answer"
                  value={adminChallengeAnswer}
                  onChange={(e) => setAdminChallengeAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  data-testid="input-admin-challenge"
                />
              </div>
              <Button
                onClick={handleAdminLogin}
                className="w-full"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? "Logging in..." : "Login as Admin"}
              </Button>
            </TabsContent>
            
            <TabsContent value="super" className="space-y-4 mt-4" data-testid="content-super-login">
              <div>
                <Input
                  type="password"
                  placeholder="Super Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSuperAdminLogin()}
                  data-testid="input-super-password"
                />
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Human verification</span>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={resetChallenges}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">Solve: {superChallenge.left} + {superChallenge.right}</p>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter answer"
                  value={superChallengeAnswer}
                  onChange={(e) => setSuperChallengeAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSuperAdminLogin()}
                  data-testid="input-super-challenge"
                />
              </div>
              <Button
                onClick={handleSuperAdminLogin}
                className="w-full"
                disabled={isLoading}
                data-testid="button-super-login"
              >
                {isLoading ? "Logging in..." : "Login as Super Admin"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </Orb>
    </div>
  );
}
