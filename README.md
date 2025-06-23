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
