import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileDetails from '@/components/profile/ProfileDetails';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';
import { changePassword, updateUserProfile } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { refreshUserCredits, recalculateUserCredits } from '@/services/userCredits';
import { fixAllUserCredits } from '@/services/call/creditFix';

const Profile: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [isRefreshingCredit, setIsRefreshingCredit] = useState<boolean>(false);
  const [isRecalculatingCredit, setIsRecalculatingCredit] = useState<boolean>(false);
  const [isFixingAllCredits, setIsFixingAllCredits] = useState<boolean>(false);
  const [lastCreditRefresh, setLastCreditRefresh] = useState<Date | null>(null);
  
  // Auto-refresh credits when component mounts
  useEffect(() => {
    if (user) {
      const refreshOnMount = async () => {
        console.log('Auto-refreshing credit balance on profile page load');
        await handleRefreshCredit();
      };
      
      refreshOnMount();
    }
  }, []);
  
  // Update last credit refresh time when component mounts
  useEffect(() => {
    if (user) {
      setLastCreditRefresh(new Date());
    }
  }, [user]);
  
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
  const handleRefreshCredit = async () => {
    if (!user) return;
    
    try {
      setIsRefreshingCredit(true);
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
  
  // Function to recalculate a user's credits based on call history
  const handleRecalculateCredit = async () => {
    if (!user) return;
    
    try {
      setIsRecalculatingCredit(true);
      console.log('Recalculating credit balance for user:', user.id);
      
      // Show a warning toast first
      toast({
        title: "Recalculating Credits",
        description: "Recalculating your credits based on call history. This may take a moment...",
        variant: "warning",
      });
      
      // Use the dedicated service function for credit recalculation
      const result = await recalculateUserCredits(user.id);
      
      if (result.success) {
        // Use the Auth context's refresh function to update the user object
        await refreshUserData();
        
        // Update last refresh timestamp
        setLastCreditRefresh(new Date());
        
        toast({
          title: "Credit Balance Recalculated",
          description: `Your credit balance has been updated from ${result.previousBalance} to ${result.newBalance}`,
        });
      } else {
        toast({
          title: "Recalculation Failed",
          description: result.message || "Could not recalculate your credit balance. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error recalculating credit balance:', error);
      toast({
        title: "Recalculation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculatingCredit(false);
    }
  };
  
  // Function to fix all user credits (admin function)
  const handleFixAllCredits = async () => {
    if (!user) return;
    
    try {
      setIsFixingAllCredits(true);
      console.log('Recalculating all user credits in the system');
      
      const result = await fixAllUserCredits();
      
      if (result.success) {
        // Refresh the current user's data after the update
        await refreshUserData();
        
        // Update last refresh timestamp
        setLastCreditRefresh(new Date());
        
        toast({
          title: "Credit Balance Recalculation Complete",
          description: `Successfully updated ${result.usersUpdated} users' credit balances`,
        });
      } else {
        toast({
          title: "Credit Recalculation Failed",
          description: result.message || "Could not recalculate credit balances. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error recalculating all user credits:', error);
      toast({
        title: "Recalculation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFixingAllCredits(false);
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
  
  // Check if user has admin privileges (first user for simplicity)
  const isAdmin = user && user.id === 'b36cd024-3f22-43f0-af73-9da43bcf0884';
  
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
          <>
            <ProfileDetails 
              user={user} 
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={() => setIsChangingPassword(true)}
              onRefreshCredit={handleRefreshCredit}
              onRecalculateCredit={handleRecalculateCredit}
              isUpdating={isUpdating}
              isRefreshingCredit={isRefreshingCredit}
              isRecalculatingCredit={isRecalculatingCredit}
              lastCreditRefresh={lastCreditRefresh}
            />
            
            {isAdmin && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
                <h3 className="text-lg font-semibold text-yellow-800">Administrator Actions</h3>
                <p className="text-sm text-yellow-700 mb-4">Use these functions with caution as they affect all users in the system.</p>
                <button 
                  onClick={handleFixAllCredits}
                  disabled={isFixingAllCredits}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-yellow-300"
                >
                  {isFixingAllCredits ? 'Recalculating All Credits...' : 'Recalculate All User Credits'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
