import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

export default function Tasks() {
  const { userRole, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  useEffect(() => {
    fetchTasks();
  }, [userRole, user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on role
      if (userRole === 'bench_employee') {
        // Show available tasks (not assigned) or tasks assigned to current user
        query = query.or(`assigned_to.is.null,assigned_to.eq.${user.id}`);
      } else if (userRole === 'team_lead') {
        // Show tasks created by current team lead
        query = query.eq('created_by', user.id);
      }
      // Admin sees all tasks (no additional filter)

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to fetch tasks');
      } else {
        setTasks((data as any) || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (userRole !== 'bench_employee') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: user.id,
          status: 'in_progress' 
        })
        .eq('id', taskId)
        .eq('assigned_to', null); // Only claim if not already assigned

      if (error) {
        toast.error('Failed to claim task');
      } else {
        toast.success('Task claimed successfully!');
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to claim task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (userRole !== 'bench_employee') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('assigned_to', user.id);

      if (error) {
        toast.error('Failed to complete task');
      } else {
        toast.success('Task marked as completed! Waiting for verification.');
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      if (searchTerm) {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               task.description.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'due_date') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'verified':
        return <Trophy className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isTaskOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const canClaimTask = (task: Task) => {
    return userRole === 'bench_employee' && 
           task.status === 'pending' && 
           !task.assigned_to;
  };

  const canCompleteTask = (task: Task) => {
    return userRole === 'bench_employee' && 
           task.status === 'in_progress' && 
           task.assigned_to === user.id;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {userRole === 'bench_employee' ? 'Browse Tasks' : 
               userRole === 'team_lead' ? 'My Tasks' : 'All Tasks'}
            </h1>
            <p className="text-muted-foreground">
              {userRole === 'bench_employee' ? 'Find tasks to work on and earn points' :
               userRole === 'team_lead' ? 'Manage and track your assigned tasks' :
               'Overview of all system tasks'}
            </p>
          </div>

          {(userRole === 'admin' || userRole === 'team_lead') && (
            <Button onClick={() => window.location.href = '/create-task'}>
              Create New Task
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest First</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="points">Points (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="grid gap-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        {task.title}
                        {isTaskOverdue(task.due_date) && task.status !== 'verified' && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Created by {task.profiles?.full_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(task.due_date)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">{task.status.replace('_', ' ')}</span>
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold text-lg text-employee">{task.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {task.assigned_to ? (
                        task.assigned_to === user.id ? (
                          <span className="text-employee font-medium">Assigned to you</span>
                        ) : (
                          <span>Assigned to another user</span>
                        )
                      ) : (
                        <span>Available to claim</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {canClaimTask(task) && (
                        <Button 
                          size="sm" 
                          onClick={() => handleClaimTask(task.id)}
                          className="bg-gradient-employee"
                        >
                          Claim Task
                        </Button>
                      )}
                      
                      {canCompleteTask(task) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}