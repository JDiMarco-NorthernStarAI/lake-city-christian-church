import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
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
import JoinSmallGroup from "@/pages/join-small-group";
import ConnectServe from "@/pages/connect-serve";
import Encounter from "@/pages/encounter";
import Announcements from "@/pages/announcements";
import Give from "@/pages/give";
import GiveSuccess from "@/pages/give-success";
import PlanVisit from "@/pages/plan-visit";
import Contact from "@/pages/contact";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Account from "@/pages/account";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import PublicForm from "@/pages/public-form";
import Signups from "@/pages/signups";
import SignupDetail from "@/pages/signup-detail";
import SmsTerms from "@/pages/sms-terms";
import { useAnalytics } from "@/hooks/use-analytics";
import NotificationPrompt from "@/components/notification-prompt";

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
      <Route path="/join-small-group" component={JoinSmallGroup} />
      <Route path="/connect-serve" component={ConnectServe} />
      <Route path="/encounter" component={Encounter} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/give" component={Give} />
      <Route path="/giving">{() => { window.location.replace("/give"); return null; }}</Route>
      <Route path="/connect">{() => { window.location.replace("/forms/volunteer-signup"); return null; }}</Route>
      <Route path="/news">{() => { window.location.replace("/announcements"); return null; }}</Route>
      <Route path="/give/success" component={GiveSuccess} />
      <Route path="/plan-visit" component={PlanVisit} />
      <Route path="/contact" component={Contact} />
      <Route path="/sms-terms" component={SmsTerms} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/signups/:slug" component={SignupDetail} />
      <Route path="/signups" component={Signups} />
      <Route path="/forms/:slug" component={PublicForm} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  useAnalytics();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ScrollToTop />
          {!isAdmin && <Navbar />}
          <main>
            <Router />
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && <NotificationPrompt />}
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
