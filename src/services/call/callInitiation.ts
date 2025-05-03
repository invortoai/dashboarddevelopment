
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

const WEBHOOK_URL = 'https://n8n.srv743759.hstgr.cloud/webhook/1845214a-2b66-4b02-86fa-379cfd38fef3';
const CREDITS_PER_MINUTE = 10;

export const initiateCall = async (userId: string, number: string, developer: string, project: string): Promise<{ 
  success: boolean; 
  message: string; 
  callDetails?: CallDetails
}> => {
  try {
    // Check user's credit balance
    const { data: user, error: userError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return { success: false, message: 'Could not verify user credits' };
    }
    
    if (user.credit < CREDITS_PER_MINUTE) {
      return { success: false, message: 'Insufficient credits to make a call' };
    }
    
    const currentTime = getCurrentISTDateTime();
    
    // First create the call details entry in the database
    const { data: newCall, error: callError } = await supabase
      .from('call_details')
      .insert({
        user_id: userId,
        number,
        developer,
        project,
        created_at: currentTime,
      })
      .select()
      .single();
      
    if (callError) throw callError;
    
    // Record call initiation activity
    const { data: activity, error: activityError } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'call_initiated',
        timestamp: currentTime,
        call_detail_id: newCall.id
      })
      .select()
      .single();
      
    if (activityError) throw activityError;
    
    // Create a call_log entry with only the necessary information from call_details
    // No dummy or placeholder data is included
    const { data: callLog, error: callLogError } = await supabase
      .from('call_log')
      .insert({
        call_detail_id: newCall.id,
        user_id: userId,
        number,
        developer,
        project,
        created_at: currentTime
      })
      .select()
      .single();
      
    if (callLogError) throw callLogError;
    
    // Send the webhook request to trigger the call
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: newCall.id,
        user_id: userId,
        number,
        developer,
        project
      })
    });
    
    // Parse and return the call details
    const callDetails: CallDetails = {
      id: newCall.id,
      userId: newCall.user_id,
      number: newCall.number,
      developer: newCall.developer,
      project: newCall.project,
      createdAt: newCall.created_at
    };
    
    return { 
      success: true, 
      message: 'Call initiated successfully', 
      callDetails 
    };
  } catch (error) {
    console.error('Call initiation error:', error);
    return { success: false, message: 'Failed to initiate call' };
  }
};
