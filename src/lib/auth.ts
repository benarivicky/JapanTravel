// This is a mock authentication function.
// In a real application, you would use Firebase Authentication here.

export async function signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
  console.log(`Attempting login for email: ${email}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (email.toLowerCase() === 'test@example.com' && password === 'password') {
    console.log("Login successful");
    return { success: true, tripId: 'TRIP_123' };
  } else {
    console.log("Login failed");
    return { success: false, error: 'אימייל או סיסמה שגויים' };
  }
}
