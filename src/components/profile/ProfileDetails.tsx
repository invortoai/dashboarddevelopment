import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { RefreshCw } from 'lucide-react';

interface ProfileDetailsProps {
  user: User;
  onUpdateProfile: (data: { name?: string; phoneNumber?: string }) => void;
  onChangePassword: () => void;
  onRefreshCredit: () => void;
  isUpdating: boolean;
  isRefreshingCredit?: boolean;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ 
  user, 
  onUpdateProfile, 
  onChangePassword,
  onRefreshCredit,
  isUpdating,
  isRefreshingCredit = false
}) => {
  const [name, setName] = useState(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, phoneNumber });
    setIsEditing(false);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View and manage your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>User ID</Label>
                <div className="mt-1 text-sm text-gray-500">{user.id}</div>
              </div>
              <div>
                <Label>Signup Date</Label>
                <div className="mt-1 text-sm text-gray-500">{formatDate(user.signupTime)}</div>
              </div>
              <div>
                <Label>Last Login</Label>
                <div className="mt-1 text-sm text-gray-500">{formatDate(user.lastLogin)}</div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <Label>Available Credits</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRefreshCredit}
                    disabled={isRefreshingCredit}
                    className="h-6 px-2"
                  >
                    <RefreshCw size={14} className={`mr-1 ${isRefreshingCredit ? 'animate-spin' : ''}`} />
                    {isRefreshingCredit ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
                <div className="mt-1 text-sm font-semibold text-purple-600">{user.credit}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="Your phone number"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="text-sm">{user.name || 'Not set'}</div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="text-sm">{user.phoneNumber || 'Not set'}</div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSubmit} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onChangePassword}>Change Password</Button>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileDetails;
