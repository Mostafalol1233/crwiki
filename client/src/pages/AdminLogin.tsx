import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!username || !adminPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: adminPassword }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const { token, admin } = await response.json();
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", admin.role);
      localStorage.setItem("adminUsername", admin.username);
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

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Invalid password");
      }

      const { token, admin } = await response.json();
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", admin.role);
      localStorage.setItem("adminUsername", "super_admin");
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
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
    </div>
  );
}
