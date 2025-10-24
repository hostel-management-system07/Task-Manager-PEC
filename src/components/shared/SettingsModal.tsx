import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updateEmail, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { userData, currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(userData?.settings?.emailNotifications ?? true);
  const [taskReminders, setTaskReminders] = useState(userData?.settings?.taskReminders ?? true);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        settings: {
          emailNotifications,
          taskReminders,
          theme
        }
      });

      // Update email if changed
      if (email !== currentUser.email && email.trim()) {
        await updateEmail(currentUser, email);
      }

      // Update password if provided
      if (newPassword.trim()) {
        await updatePassword(currentUser, newPassword);
        setNewPassword('');
      }

      toast.success('Settings updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(`Failed to update settings: ${error.message || 'Please try again'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Profile Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Profile</h3>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={userData?.role || ''}
                disabled
                className="opacity-60"
              />
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Security</h3>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminders for due tasks</p>
              </div>
              <Switch
                checked={taskReminders}
                onCheckedChange={setTaskReminders}
              />
            </div>
          </div>

          <Separator />

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}