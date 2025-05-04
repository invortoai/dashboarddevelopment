
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileDetails from '@/components/profile/ProfileDetails';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';
import { changePassword, updateUserProfile } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { refreshUserCredits } from '@/services/userCredits';
import { useLogger } from '@/utils/logger';

const Profile: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const logger = useLogger();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [isRefreshingCredit, setIsRefreshingCredit] = useState<boolean>(false);
  const [lastCreditRefresh, setLastCreditRefresh] = useState<Date | null>(null);
  
  // Update last credit refresh time when component mounts
  useEffect(() => {
    if (user) {
      setLastCreditRefresh(new Date());
      logger.activity('profile', 'view', { userId: user.id });
    }
  }, [user]);
  
  // Handle profile update
  const handleUpdateProfile = async (data: { name?: string; phoneNumber?: string }) => {
    if (!user) return;
    
    try {
      logger.activity('profile', 'update_attempt', data);
      setIsUpdating(true);
      const result = await updateUserProfile(user.id, data);
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        
        logger.activity('profile', 'update_success', { userId: user.id });
        
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
        logger.error('profile_update_failed', { error: result.message });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      logger.error('profile_update_exception', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Direct function to refresh credit balance
  const refreshCreditBalance = async () => {
    if (!user) return;
    
    try {
      setIsRefreshingCredit(true);
      logger.activity('credits', 'refresh_attempt', { userId: user.id });
      console.log('Manually refreshing credit balance for user:', user.id);
      
      // Use the dedicated service function for credit refresh
      const result = await refreshUserCredits(user.id);
      
      if (result.success) {
        // Use the Auth context's refresh function to update the user object
        await refreshUserData();
        
        // Update last refresh timestamp
        setLastCreditRefresh(new Date());
        
        toast({
          title: "Credit Balance Refreshed",
          description: `Your current credit balance is ${result.credits}`,
        });
        
        logger.activity('credits', 'refresh_success', { 
          userId: user.id, 
          credits: result.credits 
        });
      } else {
        toast({
          title: "Refresh Failed",
          description: result.message || "Could not refresh your credit balance. Please try again.",
          variant: "destructive",
        });
        logger.error('credits_refresh_failed', { error: result.message });
      }
    } catch (error) {
      console.error('Error refreshing credit balance:', error);
      toast({
        title: "Refresh Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      logger.error('credits_refresh_exception', error);
    } finally {
      setIsRefreshingCredit(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    if (!user) return;
    
    try {
      logger.activity('password', 'change_attempt', { userId: user.id });
      setIsSubmittingPassword(true);
      const result = await changePassword(user.id, data.currentPassword, data.newPassword);
      
      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
        setIsChangingPassword(false);
        logger.activity('password', 'change_success', { userId: user.id });
      } else {
        toast({
          title: "Password Change Failed",
          description: result.message,
          variant: "destructive",
        });
        logger.error('password_change_failed', { error: result.message });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      logger.error('password_change_exception', error);
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
            lastCreditRefresh={lastCreditRefresh}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
