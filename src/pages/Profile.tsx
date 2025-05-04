import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileDetails from '@/components/profile/ProfileDetails';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';
import { changePassword, updateUserProfile } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { refreshUserCredits } from '@/services/userCredits';

const Profile: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [isRefreshingCredit, setIsRefreshingCredit] = useState<boolean>(false);
  const [hasRefreshed, setHasRefreshed] = useState<boolean>(false);
  
  // Only refresh user data once when profile page loads
  useEffect(() => {
    const refreshData = async () => {
      if (user && !hasRefreshed) {
        console.log('Profile page: Forcing refresh of user data to get latest credit balance');
        try {
          setIsRefreshingCredit(true);
          await refreshUserData();
          console.log('User data refreshed successfully on profile page load');
          setHasRefreshed(true); // Mark as refreshed to prevent infinite loop
        } catch (error) {
          console.error('Error refreshing user data on profile page:', error);
        } finally {
          setIsRefreshingCredit(false);
        }
      }
    };
    
    refreshData();
  }, [refreshUserData, user, hasRefreshed]); // Added hasRefreshed to dependencies
  
  // Handle profile update
  const handleUpdateProfile = async (data: { name?: string; phoneNumber?: string }) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      const result = await updateUserProfile(user.id, data);
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        
        // Update the user in the auth context
        if (result.user) {
          // Refresh user data to reflect updated information
          await refreshUserData();
          toast({
            title: "Data Refreshed",
            description: "Your profile data has been refreshed with the latest information.",
          });
        }
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Direct function to refresh credit balance
  const refreshCreditBalance = async () => {
    if (!user) return;
    
    try {
      setIsRefreshingCredit(true);
      console.log('Manually refreshing credit balance for user:', user.id);
      
      // Use the dedicated service function for credit refresh
      const result = await refreshUserCredits(user.id);
      
      if (result.success) {
        // Use the Auth context's refresh function to update the user object
        await refreshUserData();
        
        toast({
          title: "Credit Balance Refreshed",
          description: `Your current credit balance is ${result.credits}`,
        });
      } else {
        toast({
          title: "Refresh Failed",
          description: result.message || "Could not refresh your credit balance. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing credit balance:', error);
      toast({
        title: "Refresh Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingCredit(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    if (!user) return;
    
    try {
      setIsSubmittingPassword(true);
      const result = await changePassword(user.id, data.currentPassword, data.newPassword);
      
      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
        setIsChangingPassword(false);
      } else {
        toast({
          title: "Password Change Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        {isChangingPassword ? (
          <ChangePasswordForm 
            onSubmit={handleChangePassword}
            onCancel={() => setIsChangingPassword(false)}
            isSubmitting={isSubmittingPassword}
          />
        ) : (
          <ProfileDetails 
            user={user} 
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={() => setIsChangingPassword(true)}
            onRefreshCredit={refreshCreditBalance}
            isUpdating={isUpdating}
            isRefreshingCredit={isRefreshingCredit}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
