import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProjectManagement } from '@/components/admin/ProjectManagement';
import { TaskManagement } from '@/components/admin/TaskManagement';
import { Analytics } from '@/components/admin/Analytics';
import { Chat } from '@/components/shared/Chat';
import { SettingsModal } from '@/components/shared/SettingsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { logout, userData } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <ProjectManagement />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TaskManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Analytics />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Chat type="project" projectId="general" />
              <div className="text-center text-muted-foreground p-8">
                Select a user from User Management to start a private chat
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
