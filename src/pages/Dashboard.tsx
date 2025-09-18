import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckSquare, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target,
  AlertCircle,
  Calendar
} from "lucide-react";
import { Layout } from "@/components/Layout";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalPoints: number;
  totalUsers?: number;
  recentTasks: any[];
}

export default function Dashboard() {
  const { userRole, profile, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalPoints: 0,
    recentTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      let query = supabase.from('tasks').select('*');
      
      // Filter based on role
      if (userRole === 'bench_employee') {
        query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
      } else if (userRole === 'team_lead') {
        query = query.eq('created_by', user.id);
      }

      const { data: tasks } = await query;

      // Get user count for admins
      let totalUsers = 0;
      if (userRole === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      }

      // Calculate stats
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed' || t.status === 'verified').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0;

      // Get recent tasks
      const recentTasks = tasks?.slice(0, 5) || [];

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        totalPoints: profile?.total_points || 0,
        totalUsers,
        recentTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'in_progress':
        return 'bg-info/10 text-info border-info/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'verified':
        return 'bg-employee/10 text-employee border-employee/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name || user?.email}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' && "Manage your team and track overall progress."}
            {userRole === 'team_lead' && "Oversee your tasks and team performance."}
            {userRole === 'bench_employee' && "Discover new tasks and boost your skills."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {userRole === 'admin' && (
            <Card className="shadow-admin">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-admin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active team members
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {userRole === 'bench_employee' ? 'Available to you' : 'Created by you'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks finished
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'bench_employee' ? 'My Points' : 'Pending Tasks'}
              </CardTitle>
              {userRole === 'bench_employee' ? (
                <Trophy className="h-4 w-4 text-employee" />
              ) : (
                <Clock className="h-4 w-4 text-warning" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRole === 'bench_employee' ? stats.totalPoints : stats.pendingTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                {userRole === 'bench_employee' ? 'Points earned' : 'Need attention'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              {userRole === 'bench_employee' 
                ? 'Latest available tasks you can work on'
                : 'Recently created or updated tasks'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks available yet.</p>
                {userRole !== 'bench_employee' && (
                  <Button className="mt-4" onClick={() => window.location.href = '/create-task'}>
                    Create Your First Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(task.due_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium">{task.points} pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}