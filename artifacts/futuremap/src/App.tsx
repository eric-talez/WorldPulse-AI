import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import JobReport from "@/pages/JobReport";
import Forum from "@/pages/Forum";
import About from "@/pages/About";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminUserDetail from "@/pages/admin/AdminUserDetail";
import AdminForum from "@/pages/admin/AdminForum";
import AdminBanners from "@/pages/admin/AdminBanners";
import Layout from "@/components/layout/Layout";
import { LanguageProvider } from "@/lib/language";
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/job" component={JobReport} />
        <Route path="/forum" component={Forum} />
        <Route path="/about" component={About} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/users/:wallet" component={AdminUserDetail} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/forum" component={AdminForum} />
        <Route path="/admin/banners" component={AdminBanners} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
