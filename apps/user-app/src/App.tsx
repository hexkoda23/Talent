import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LearnMore from "./pages/LearnMore.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Register from "./pages/Register.tsx";
import Assessment from "./pages/Assessment.tsx";
import Countdown from "./pages/Countdown.tsx";
import GamePlay from "./pages/GamePlay.tsx";
import Result from "./pages/Result.tsx";
import Status from "./pages/Status.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import { DashboardLayout } from "./components/DashboardLayout.tsx";
import DashboardHome from "./pages/dashboard/Home.tsx";
import Quests from "./pages/dashboard/Quests.tsx";
import Raid from "./pages/dashboard/Raid.tsx";
import Audits from "./pages/dashboard/Audits.tsx";
import AuditSubmit from "./pages/dashboard/AuditSubmit.tsx";
import Learn from "./pages/dashboard/Learn.tsx";
import Module from "./pages/dashboard/Module.tsx";
import Workspace from "./pages/dashboard/Workspace.tsx";
import Logbook from "./pages/dashboard/Logbook.tsx";
import Profile from "./pages/dashboard/Profile.tsx";
import Notifications from "./pages/dashboard/Notifications.tsx";
import LeaderboardGlobal from "./pages/dashboard/LeaderboardGlobal.tsx";
import LeaderboardCampus from "./pages/dashboard/LeaderboardCampus.tsx";
import LeaderboardCourse from "./pages/dashboard/LeaderboardCourse.tsx";
import LeaderboardProgram from "./pages/dashboard/LeaderboardProgram.tsx";
import Community from "./pages/dashboard/Community.tsx";
import Checkpoints from "./pages/dashboard/Checkpoints.tsx";
import Achievements from "./pages/dashboard/Achievements.tsx";
import { authToken } from "./api/client.ts";

const queryClient = new QueryClient();

const RequireToken = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const redirect = `${location.pathname}${location.search}`;
  return authToken.exists() ? children : <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Register />} />
          <Route path="/countdown" element={<RequireToken><Countdown /></RequireToken>} />
          <Route path="/register" element={<RequireToken><Register /></RequireToken>} />
          <Route path="/assessment" element={<RequireToken><Assessment /></RequireToken>} />
          <Route path="/assessment/play" element={<RequireToken><GamePlay /></RequireToken>} />
          <Route path="/assessment/result" element={<RequireToken><Result /></RequireToken>} />
          <Route path="/status" element={<RequireToken><Status /></RequireToken>} />
          <Route path="/onboarding" element={<RequireToken><Onboarding /></RequireToken>} />
          <Route path="/dashboard" element={<RequireToken><DashboardLayout /></RequireToken>}>
            <Route index element={<DashboardHome />} />
            <Route path="learn" element={<Learn />} />
            <Route path="learn/module/:moduleId" element={<Module />} />
            <Route path="quests" element={<Quests />} />
            <Route path="raid" element={<Raid />} />
            <Route path="audits" element={<Audits />} />
            <Route path="audits/:auditId" element={<AuditSubmit />} />
            <Route path="checkpoints" element={<Checkpoints />} />
            <Route path="leaderboard" element={<Navigate to="global" replace />} />
            <Route path="leaderboard/global" element={<LeaderboardGlobal />} />
            <Route path="leaderboard/campus" element={<LeaderboardCampus />} />
            <Route path="leaderboard/course" element={<LeaderboardCourse />} />
            <Route path="leaderboard/program" element={<LeaderboardProgram />} />
            <Route path="community" element={<Community />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="logbook" element={<Logbook />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
