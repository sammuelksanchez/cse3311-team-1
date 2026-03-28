import { auth } from '@/firebaseconfig';

const BACKEND_URL = 'http://10.1.58.20:8000';

export const getCustomer = async () => {
  // Get the JWT token from Firebase
  const token = await auth.currentUser?.getIdToken();
  
  if (!token) throw new Error('No user logged in');
  
  const response = await fetch(`${BACKEND_URL}/customer`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch customer');
  
  return response.json();
};

export const getRankings = async () => {
  const token = await auth.currentUser?.getIdToken();

  if (!token) throw new Error('No user logged in');

  const response = await fetch(`${BACKEND_URL}/rankings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch rankings');

  return response.json();
};

export const getFinancials = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No user logged in');

  const response = await fetch(`${BACKEND_URL}/get-financials`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch financials');
  return response.json();
};

export const saveFinancials = async (investments: number, savings: number, liabilities: number) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No user logged in');

  const response = await fetch(`${BACKEND_URL}/save-financials`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ investments, savings, liabilities })
  });
  if (!response.ok) throw new Error('Failed to save financials');
  return response.json();
};