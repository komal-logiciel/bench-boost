import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BenchBoost
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Transform your bench resources into productive team members with structured task management and skill development
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90 text-lg px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to manage bench resources
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline task assignment, track progress, and boost team productivity with our comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-admin">
              <CardHeader>
                <div className="p-3 rounded-lg bg-admin/10 w-fit">
                  <Shield className="h-8 w-8 text-admin" />
                </div>
                <CardTitle className="text-xl">Role-Based Access</CardTitle>
                <CardDescription>
                  Secure, hierarchical access control with distinct permissions for Admins, Team Leads, and Employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Admin dashboard for user management</li>
                  <li>• Team Lead task creation and verification</li>
                  <li>• Employee self-service task browsing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lead">
              <CardHeader>
                <div className="p-3 rounded-lg bg-lead/10 w-fit">
                  <Target className="h-8 w-8 text-lead" />
                </div>
                <CardTitle className="text-xl">Smart Task Management</CardTitle>
                <CardDescription>
                  Create, assign, and track tasks with points-based rewards and comprehensive status tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Point-based reward system</li>
                  <li>• Task status tracking and verification</li>
                  <li>• Deadline management and notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <div className="p-3 rounded-lg bg-employee/10 w-fit">
                  <TrendingUp className="h-8 w-8 text-employee" />
                </div>
                <CardTitle className="text-xl">Performance Analytics</CardTitle>
                <CardDescription>
                  Comprehensive reporting and analytics to track team performance and individual growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Individual performance dashboards</li>
                  <li>• Team leaderboards and rankings</li>
                  <li>• Detailed progress reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to boost your bench resources?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join teams already using BenchBoost to maximize their talent potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <div className="space-y-2">
              <Users className="h-12 w-12 mx-auto text-admin" />
              <h3 className="font-semibold">For Admins</h3>
              <p className="text-muted-foreground">
                Manage teams, oversee progress, and make data-driven decisions
              </p>
            </div>
            <div className="space-y-2">
              <Target className="h-12 w-12 mx-auto text-lead" />
              <h3 className="font-semibold">For Team Leads</h3>
              <p className="text-muted-foreground">
                Create tasks, verify completion, and guide team development
              </p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-12 w-12 mx-auto text-employee" />
              <h3 className="font-semibold">For Employees</h3>
              <p className="text-muted-foreground">
                Pick tasks, earn points, and showcase your growing skills
              </p>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90 text-lg px-12"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
