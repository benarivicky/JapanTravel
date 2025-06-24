# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Publishing Your App

This app is configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting). To deploy it and make it live, follow these steps in your local terminal:

1.  **Install the Firebase CLI:** If you don't have it already, install the Firebase Command Line Interface.
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase:** Authenticate with your Google account.
    ```bash
    firebase login
    ```

3.  **Deploy:** From your project's root directory, run the deploy command. The Firebase project ID is already configured in your `.firebaserc` file.
    ```bash
    firebase deploy --only apphosting
    ```

After the command completes, the CLI will give you the URL of your live application!

## Troubleshooting Deployment

If you are seeing a "Failed to create project" error during deployment, it's almost always an issue with your Google Cloud account settings, not the application code. Here are some steps to diagnose the problem:

1.  **Verify Your Account:** Make sure you are logged into the correct Google account in the terminal. You can check which account is active by running:
    ```bash
    firebase login:list
    ```
    If it's the wrong account, run `firebase logout` and then `firebase login` again.

2.  **Check Project Quotas:** You may have reached the limit of how many Google Cloud projects you can create. This is a very common issue.
    *   Visit the [Google Cloud Console Quotas page](https://console.cloud.google.com/iam-admin/quotas) to check your current usage.
    *   If you are at your limit, you will need to delete old, unused projects to make room for a new one.

3.  **Check Permissions:** If you are using a work, school, or organizational Google account, your administrator may have disabled project creation permissions. You may need to contact your IT department or administrator.

4.  **Check for Projects Pending Deletion:** Sometimes, projects that are marked for deletion can still count against your quota for a period of time. Check the [Resources Pending Deletion](https://console.cloud.google.com/iam-admin/resource-manager) page.

5.  **Try Manual Creation:** Try creating a new project manually in the [Firebase Console](https://console.firebase.google.com). If this also fails, it will confirm that the issue is with your account's permissions or quotas and not with the Firebase CLI.

If you have checked all of the above and are still stuck, you may need to contact [Firebase Support](https://firebase.google.com/support) for further assistance with your account.
