
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { formatToIST } from '@/utils/dateUtils';
import { validatePhoneNumber } from '@/utils/phoneUtils';

interface ProfileDetailsProps {
  user: User;
  onUpdateProfile: (data: { name?: string; phoneNumber?: string }) => Promise<void>;
  onChangePassword: () => void;
  isUpdating: boolean;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  isUpdating
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const newErrors: { name?: string; phoneNumber?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name cannot be empty';
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits with no spaces or special characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const updates: { name?: string; phoneNumber?: string } = {};
    
    if (name !== user.name) {
      updates.name = name;
    }
    
    if (phoneNumber !== user.phoneNumber) {
      updates.phoneNumber = phoneNumber;
    }
    
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }
    
    await onUpdateProfile(updates);
    setIsEditing(false);
    setErrors({});
  };

  const handleCancel = () => {
    setName(user.name);
    setPhoneNumber(user.phoneNumber);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Profile Details</h2>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              {isEditing ? (
                <>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUpdating}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </>
              ) : (
                <p className="p-2 border border-border rounded bg-muted">{user.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              {isEditing ? (
                <>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    disabled={isUpdating}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber}</p>}
                </>
              ) : (
                <p className="p-2 border border-border rounded bg-muted">{user.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Available Credits</label>
              <p className="p-2 border border-border rounded bg-muted">{user.credit}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sign Up Date</label>
              <p className="p-2 border border-border rounded bg-muted">{formatToIST(user.signupTime)}</p>
            </div>

            {user.lastLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Login</label>
                <p className="p-2 border border-border rounded bg-muted">{formatToIST(user.lastLogin)}</p>
              </div>
            )}

            <div className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onChangePassword}
              >
                Change Password
              </Button>
            </div>

            <div className="pt-2">
              <Button 
                type="button" 
                disabled 
                className="w-full bg-secondary"
              >
                Recharge Account
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Recharge functionality coming soon
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetails;
