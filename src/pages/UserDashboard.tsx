import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsModal } from '@/components/shared/SettingsModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  members: string[];
}

interface Task {
  id: string;
  title: string;
  projectId: string;
  status: string;
}

export default function UserDashboard() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!userData) return;

    // Fetch projects where user is a member
    const projectsQuery = query(
      collection(db, 'projects'),
      where('members', 'array-contains', userData.uid)
    );

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    });

    // Fetch tasks assigned to user
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', 'array-contains', userData.uid)
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [userData]);

  const handleLogout = async () => {
    await logout();
  };

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const active = projectTasks.filter(t => t.status === 'todo').length;
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return { active, inProgress, completed };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {userData?.displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* My Projects Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">My Projects</h2>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No projects assigned yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => {
                  const stats = getProjectStats(project.id);
                  return (
                    <Card key={project.id} className="hover:border-foreground transition-colors cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{project.name}</span>
                          <FolderOpen className="h-5 w-5" />
                        </CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{stats.active}</p>
                            <p className="text-muted-foreground">Active</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{stats.inProgress}</p>
                            <p className="text-muted-foreground">In Progress</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{stats.completed}</p>
                            <p className="text-muted-foreground">Completed</p>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => navigate(`/project/${project.id}`)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Activity Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="py-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                      </p>
                    </div>
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in-progress' ? 'secondary' : 'outline'
                    }>
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
