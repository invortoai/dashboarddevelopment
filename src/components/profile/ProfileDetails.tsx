
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { RefreshCw } from 'lucide-react';
import { formatTimeAgo } from '@/utils/dateUtils';

interface ProfileDetailsProps {
  user: User;
  onUpdateProfile: (data: { name?: string; phoneNumber?: string }) => void;
  onChangePassword: () => void;
  onRefreshCredit: () => void;
  onRecalculateCredit: () => void;
  isUpdating: boolean;
  isRefreshingCredit?: boolean;
  isRecalculatingCredit?: boolean;
  lastCreditRefresh?: Date | string | null;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ 
  user, 
  onUpdateProfile, 
  onChangePassword,
  onRefreshCredit,
  onRecalculateCredit,
  isUpdating,
  isRefreshingCredit = false,
  isRecalculatingCredit = false,
  lastCreditRefresh = null
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
                <div>
                  <Label>Available Credits</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm font-semibold text-purple-600">{user.credit}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onRecalculateCredit}
                      disabled={isRecalculatingCredit}
                      className="h-7 text-xs px-2 flex items-center text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800"
                      title="Refresh your credits"
                    >
                      <RefreshCw size={12} className={isRecalculatingCredit ? 'mr-1 animate-spin text-purple-500' : 'mr-1 text-purple-500'} />
                      {isRecalculatingCredit ? 'Refreshing...' : 'Refresh Credits'}
                    </Button>
                  </div>
                  {lastCreditRefresh && (
                    <div className="mt-1 text-xs text-gray-500">
                      Last updated: {formatTimeAgo(lastCreditRefresh)}
                    </div>
                  )}
                </div>
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
