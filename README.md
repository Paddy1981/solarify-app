# Firebase Studio - Solarify

This is a Next.js starter project for a residential solar marketplace called Solarify.

## Getting Started

To run the application locally, you first need to set up your environment variables to connect to Firebase.

### Setting Up Environment Variables

1.  **Create the local environment file:**
    *   In the root of this project, create a new file named `.env.local`. **This file is for your secret keys and should NOT be shared.**

2.  **Find your Firebase Config:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   Click the gear icon next to "Project Overview" and go to **Project settings**.
    *   In the "General" tab, scroll down to the "Your apps" section.
    *   Select your web app.
    *   Under "SDK setup and configuration", select the **Config** option. You will see a `firebaseConfig` object with your project's keys.

3.  **Copy your credentials into `.env.local`:**
    *   Open your new `.env.local` file.
    *   Copy the values from your Firebase project's `firebaseConfig` object into the corresponding variables. **Make sure the variable names start with `NEXT_PUBLIC_`**.

    Your `.env.local` file should look exactly like this, but with your actual keys:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123def456
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
    ```

4.  **Install dependencies and run the server:**
    Open your terminal and run the following commands:

    ```bash
    npm install
    npm run dev
    ```

Your application should now be running locally, successfully connected to your Firebase project.