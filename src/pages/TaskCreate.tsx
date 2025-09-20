import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarIcon, Target } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const TaskCreate = () => {
  const { userRole, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('id');
  const isEditing = !!taskId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 0,
    due_date: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [fetchingTask, setFetchingTask] = useState(false);

  useEffect(() => {
    if (isEditing && taskId) {
      fetchTask();
    }
  }, [isEditing, taskId]);

  const fetchTask = async () => {
    setFetchingTask(true);
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      if (task) {
        setFormData({
          title: task.title,
          description: task.description,
          points: task.points,
          due_date: new Date(task.due_date),
        });
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast({
        title: "Error",
        description: "Failed to fetch task details",
        variant: "destructive",
      });
    } finally {
      setFetchingTask(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || formData.points <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let error;
      
      if (isEditing) {
        const taskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          points: formData.points,
          due_date: formData.due_date.toISOString(),
        };
        
        const result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', taskId);
        error = result.error;
      } else {
        const taskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          points: formData.points,
          due_date: formData.due_date.toISOString(),
          created_by: user?.id!,
        };
        
        const result = await supabase
          .from('tasks')
          .insert([taskData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task ${isEditing ? 'updated' : 'created'} successfully`,
      });

      navigate('/tasks');
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} task`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only admins and team leads can access this page
  if (userRole !== 'admin' && userRole !== 'team_lead') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (fetchingTask) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update the task details below' : 'Create a new task for your team members'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Details
            </CardTitle>
            <CardDescription>
              Fill in the task information to {isEditing ? 'update' : 'create'} the task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the task requirements and objectives"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points || ''}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  placeholder="Enter point value"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.due_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => date && setFormData({ ...formData, due_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/tasks')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TaskCreate;