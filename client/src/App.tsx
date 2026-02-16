import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import About from "@/pages/about";
import OurStory from "@/pages/our-story";
import WhatWeBelieve from "@/pages/what-we-believe";
import Leadership from "@/pages/leadership";
import Ministries from "@/pages/ministries";
import KidsMinistry from "@/pages/kids-ministry";
import StudentMinistry from "@/pages/student-ministry";
import SmallGroups from "@/pages/small-groups";
import ConnectServe from "@/pages/connect-serve";
import Encounter from "@/pages/encounter";
import Announcements from "@/pages/announcements";
import Give from "@/pages/give";
import PlanVisit from "@/pages/plan-visit";
import Contact from "@/pages/contact";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import PublicForm from "@/pages/public-form";
import { useAnalytics } from "@/hooks/use-analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/our-story" component={OurStory} />
      <Route path="/what-we-believe" component={WhatWeBelieve} />
      <Route path="/leadership" component={Leadership} />
      <Route path="/ministries" component={Ministries} />
      <Route path="/kids-ministry" component={KidsMinistry} />
      <Route path="/student-ministry" component={StudentMinistry} />
      <Route path="/small-groups" component={SmallGroups} />
      <Route path="/connect-serve" component={ConnectServe} />
      <Route path="/encounter" component={Encounter} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/give" component={Give} />
      <Route path="/plan-visit" component={PlanVisit} />
      <Route path="/contact" component={Contact} />
      <Route path="/forms/:slug" component={PublicForm} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  useAnalytics();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!isAdmin && <Navbar />}
        <main>
          <Router />
        </main>
        {!isAdmin && <Footer />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
