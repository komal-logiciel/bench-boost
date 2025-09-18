import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Trophy, 
  Settings, 
  BarChart3,
  UserPlus,
  FileText,
  Target,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, profile, userRole, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const adminItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Manage Users", url: "/users", icon: Users },
    { title: "All Tasks", url: "/tasks", icon: CheckSquare },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Reports", url: "/reports", icon: FileText },
  ];

  const teamLeadItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Tasks", url: "/tasks", icon: CheckSquare },
    { title: "Create Task", url: "/create-task", icon: UserPlus },
    { title: "Verify Tasks", url: "/verify-tasks", icon: Target },
    { title: "Team Reports", url: "/reports", icon: FileText },
  ];

  const employeeItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Browse Tasks", url: "/tasks", icon: CheckSquare },
    { title: "My Progress", url: "/progress", icon: Trophy },
    { title: "Leaderboard", url: "/leaderboard", icon: BarChart3 },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminItems;
      case 'team_lead':
        return teamLeadItems;
      case 'bench_employee':
        return employeeItems;
      default:
        return employeeItems;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin':
        return 'text-admin';
      case 'team_lead':
        return 'text-lead';
      case 'bench_employee':
        return 'text-employee';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin';
      case 'team_lead':
        return 'Team Lead';
      case 'bench_employee':
        return 'Bench Employee';
      default:
        return 'Employee';
    }
  };

  const items = getMenuItems();
  const isExpanded = items.some((i) => isActive(i.url));

  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className={`p-4 border-b ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">BenchBoost</h2>
                <p className="text-xs text-muted-foreground">Task Management</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={getRoleColor()}>
            {!collapsed && getRoleLabel()}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className={getNavCls}>
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.total_points || 0} points
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Avatar className="h-8 w-8 mx-auto">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-white">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full p-2" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}