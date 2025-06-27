# Firebase Studio - Solarify

This is a Next.js starter project for a residential solar marketplace called Solarify.

## Getting Started

To run the application locally, you first need to set up your environment variables to connect to Firebase.

### Setting Up Environment Variables

1.  **Find your Firebase Config:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   Click the gear icon next to "Project Overview" and go to **Project settings**.
    *   In the "General" tab, scroll down to the "Your apps" section.
    *   Select your web app.
    *   Under "SDK setup and configuration", select the **Config** option. You will see a `firebaseConfig` object with your project's keys.

2.  **Create a local environment file:**
    *   In the root of this project, you will find a file named `.env`.
    *   Duplicate this file and rename the copy to `.env.local`.
    *   Copy the values from your Firebase project's `firebaseConfig` object into the corresponding variables in your new `.env.local` file.

    For example:
    ```
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    # ... and so on for all the keys.
    ```

3.  **Install dependencies and run the server:**
    Open your terminal and run the following commands:

    ```bash
    npm install
    npm run dev
    ```

Your application should now be running locally, successfully connected to your Firebase project.
