
export type UserRole = "homeowner" | "installer" | "supplier";

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  password?: string; // Added for form testing
  role: UserRole;
  avatarUrl?: string;
  address?: string; // This might be more specific than the general location
  phone?: string;
  companyName?: string; // For installers and suppliers
  specialties?: string[]; // For installers
  productsOffered?: string[]; // For suppliers
  projectCount?: number; // For installers
  storeRating?: number; // For suppliers
  memberSince?: string; // Common for all
  location?: string; // e.g., "City, Country"
  currency?: string; // e.g., "USD", "INR"
}

const southIndianFirstNames = [
  "Aarav", "Aditya", "Akhil", "Anand", "Arjun", "Ashwin", "Balaji", "Bharath", "Chandra", "Deepak",
  "Devan", "Ganesh", "Gautam", "Hari", "Ishaan", "Jayant", "Karthik", "Kiran", "Krishna", "Lakshman",
  "Madhav", "Mahesh", "Manoj", "Mohan", "Naveen", "Nikhil", "Pranav", "Praveen", "Rahul", "Rajesh",
  "Rakesh", "Raman", "Ramesh", "Ravi", "Rohit", "Sachin", "Sameer", "Sanjay", "Santosh", "Saravanan",
  "Satish", "Sekar", "Shankar", "Siva", "Srinivas", "Subramani", "Suresh", "Surya", "Venkat", "Vijay",
  "Vikram", "Vishnu", "Vivek", "Yash",
  "Aishwarya", "Amrita", "Ananya", "Anjali", "Anusha", "Aparna", "Archana", "Bhavana", "Deepa", "Divya",
  "Gayathri", "Geetha", "Harini", "Indira", "Janani", "Jyothi", "Kavitha", "Keerthi", "Lakshmi", "Lavanya",
  "Madhavi", "Malini", "Meena", "Nandini", "Nisha", "Padma", "Pooja", "Priya", "Radha", "Ramya",
  "Rani", "Rekha", "Revathi", "Roja", "Sandhya", "Saranya", "Savitha", "Shanti", "Sharmila", "Shobana",
  "Shruti", "Sneha", "Sowmya", "Sudha", "Suganya", "Sunitha", "Swathi", "Uma", "Usha", "Vanitha", "Vidya"
];

const southIndianLastNames = [
  "Menon", "Nair", "Pillai", "Rao", "Reddy", "Sharma", "Verma", "Gupta", "Kumar", "Singh",
  "Iyer", "Iyengar", "Murthy", "Krishnan", "Subramanian", "Rajagopal", "Venkatesh", "Balakrishnan",
  "Ganesan", "Ramaswamy", "Chari", "Desai", "Patel", "Joshi", "Kulkarni", "Shenoy", "Bhat", "Hegde",
  "Naidu", "Setty", "Acharya", "Prakash", "Anand", "Mohan", "Nathan", "Shetty", "Kamath", "Pai"
];

const sampleLocations = ["Chennai, India", "Bangalore, India", "Hyderabad, India", "Kochi, India", "Mumbai, India", "Delhi, India", "Pune, India", "Kolkata, India"];
const sampleCurrencies = ["INR", "USD", "EUR"];

declare global {
  // eslint-disable-next-line no-var
  var _mockUsers: MockUser[] | undefined;
  // eslint-disable-next-line no-var
  var _initialMockUsers: ReadonlyArray<MockUser> | undefined; 
}

const generateRandomUser = (role: UserRole, index: number): MockUser => {
  const firstName = southIndianFirstNames[Math.floor(Math.random() * southIndianFirstNames.length)];
  const lastName = southIndianLastNames[Math.floor(Math.random() * southIndianLastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const emailDomain = role === "homeowner" ? "home.example.com" : (role === "installer" ? "install.example.com" : "supply.example.com");
  const baseEmail = `${firstName.toLowerCase().replace(/ /g, '.')}.${lastName.toLowerCase().replace(/ /g, '.')}`;
  const email = `${baseEmail}${String(index).padStart(3, '0')}@${emailDomain}`;
  const id = `${role}-user-${String(index).padStart(3, '0')}`;
  const memberSinceDate = new Date(2020 + Math.floor(Math.random()*4), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
  const mockPassword = "Solarify!123";

  const commonProfile: MockUser = {
    id,
    fullName,
    email,
    password: mockPassword,
    role,
    avatarUrl: `https://placehold.co/100x100.png?text=${firstName[0]}${lastName[0]}`,
    address: `${100 + index} Main St, ${sampleLocations[index % sampleLocations.length].split(',')[0]}, India`,
    phone: `91-9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
    memberSince: memberSinceDate.toISOString().split('T')[0],
    location: sampleLocations[index % sampleLocations.length],
    currency: sampleCurrencies[index % sampleCurrencies.length],
  };

  if (role === "installer") {
    return {
      ...commonProfile,
      companyName: `${lastName} Solar Solutions`,
      specialties: [["Residential Solar", "Commercial Solar", "Battery Storage"][index % 3], ["EV Charger Installation", "Solar Maintenance"][index % 2]],
      projectCount: 10 + Math.floor(Math.random() * 50),
    };
  }

  if (role === "supplier") {
    return {
      ...commonProfile,
      companyName: `${firstName} Energy Supplies`,
      productsOffered: [["Solar Panels", "Inverters", "Batteries"][index % 3], ["Mounting Kits", "Cables & Connectors"][index % 2]],
      storeRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
    };
  }

  return commonProfile;
};

if (!global._initialMockUsers) {
  const pristineUsers: MockUser[] = [];
  for (let i = 1; i <= 10; i++) {
    pristineUsers.push(generateRandomUser("homeowner", i));
  }
  for (let i = 1; i <= 10; i++) {
    pristineUsers.push(generateRandomUser("installer", i));
  }
  for (let i = 1; i <= 10; i++) {
    pristineUsers.push(generateRandomUser("supplier", i));
  }
  global._initialMockUsers = Object.freeze(JSON.parse(JSON.stringify(pristineUsers)));
}

if (!global._mockUsers) {
  global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
}


export const mockUsers: MockUser[] = global._mockUsers!; 

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  const lowerEmail = email.toLowerCase();

  const userFromInitialSet = global._initialMockUsers?.find(u => u.email.toLowerCase() === lowerEmail);
  let userFromStorage: MockUser | null = null;

  if (typeof window !== 'undefined') {
    const storedProfileString = localStorage.getItem(`userProfile_${lowerEmail}`);
    if (storedProfileString) {
      try {
        userFromStorage = JSON.parse(storedProfileString) as MockUser;
        // Ensure the email matches, case-insensitively, to prevent issues with localStorage keys
        if (userFromStorage && userFromStorage.email.toLowerCase() !== lowerEmail) {
            userFromStorage = null; 
        }
      } catch (e) {
        console.error(`Failed to parse localStorage profile for ${lowerEmail}:`, e);
        localStorage.removeItem(`userProfile_${lowerEmail}`); 
        userFromStorage = null;
      }
    }
  }

  let effectiveUser: MockUser | undefined = undefined;

  if (userFromInitialSet) {
    if (userFromStorage && userFromStorage.email.toLowerCase() === lowerEmail) {
      // Both exist for the same email.
      // If IDs are different, it means a pre-defined mock user (e.g. installer-user-001)
      // was signed up, resulting in a Firebase UID in localStorage.
      // For consistent demo data (role, associated RFQs etc.), prioritize the original mock profile.
      // However, allow fields like fullName, location from localStorage to override if they were updated in settings.
      if (userFromInitialSet.id !== userFromStorage.id) {
        effectiveUser = {
          ...userFromInitialSet, // Base is the original mock user (for ID, role, original mock data associations)
          fullName: userFromStorage.fullName || userFromInitialSet.fullName,
          location: userFromStorage.location || userFromInitialSet.location,
          currency: userFromStorage.currency || userFromInitialSet.currency,
          phone: userFromStorage.phone || userFromInitialSet.phone,
          avatarUrl: userFromStorage.avatarUrl || userFromInitialSet.avatarUrl,
          companyName: userFromStorage.companyName || userFromInitialSet.companyName,
          specialties: userFromStorage.specialties || userFromInitialSet.specialties,
          productsOffered: userFromStorage.productsOffered || userFromInitialSet.productsOffered,
          // We use userFromStorage.id (Firebase UID) because auth relies on it, but original role.
          id: userFromStorage.id, 
        };
      } else {
        // IDs are the same, or only userFromStorage exists matching the initial.
        // This means userFromStorage is the authoritative version.
        effectiveUser = userFromStorage;
      }
    } else {
      // Only userFromInitialSet exists for this email.
      effectiveUser = userFromInitialSet;
    }
  } else if (userFromStorage) {
    // User only exists in localStorage (e.g., a completely new signup not in initial mocks).
    effectiveUser = userFromStorage;
  }


  // Synchronize global._mockUsers (the working array)
  if (global._mockUsers && effectiveUser) {
    const effectiveUserId = effectiveUser.id;
    const effectiveUserEmailLower = effectiveUser.email.toLowerCase();

    // Remove any user from working array that has the same email but a *different* ID than effectiveUser
    // This cleans up potential old entries if a demo user was signed up (creating a new Firebase ID).
    const conflictingEmailIndex = global._mockUsers.findIndex(u => 
        u.email.toLowerCase() === effectiveUserEmailLower && u.id !== effectiveUserId
    );
    if (conflictingEmailIndex !== -1) {
      global._mockUsers.splice(conflictingEmailIndex, 1);
    }
    
    const existingUserIndexInWorkingArray = global._mockUsers.findIndex(u => u.id === effectiveUserId);
    if (existingUserIndexInWorkingArray === -1) {
      // User not in working array by ID, add them.
      global._mockUsers.push(JSON.parse(JSON.stringify(effectiveUser)));
    } else {
      // User found by ID, update them.
      global._mockUsers[existingUserIndexInWorkingArray] = JSON.parse(JSON.stringify(effectiveUser));
    }
  }
  return effectiveUser ? JSON.parse(JSON.stringify(effectiveUser)) : undefined;
};


export const getMockUserById = (id: string): MockUser | undefined => {
  // Prioritize the working array as it's kept in sync by getMockUserByEmail
  const userFromWorkingArray = global._mockUsers?.find(u => u.id === id);
  if (userFromWorkingArray) return JSON.parse(JSON.stringify(userFromWorkingArray));

  // Fallback to initial set if not in working array (should be rare if getMockUserByEmail is called on login)
  const userFromInitialSet = global._initialMockUsers?.find(u => u.id === id);
  if (userFromInitialSet) {
    // If found in initial but not working, add it to working (could happen if ID is known by other means)
    if (global._mockUsers && !global._mockUsers.find(u => u.id === id)) {
      global._mockUsers.push(JSON.parse(JSON.stringify(userFromInitialSet)));
    }
    return JSON.parse(JSON.stringify(userFromInitialSet));
  }
  
  // Final fallback to iterating localStorage (should ideally not be needed if getMockUserByEmail covers all cases)
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.id === id) {
               if (global._mockUsers && !global._mockUsers.some(u => u.id === parsedProfile.id)) {
                 global._mockUsers.push(JSON.parse(JSON.stringify(parsedProfile))); 
               }
              return JSON.parse(JSON.stringify(parsedProfile));
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  return undefined;
};


export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  const allKnownUsers = new Map<string, MockUser>();

  // 1. Start with the pristine initial set for the role
  global._initialMockUsers?.forEach(user => {
    if (user.role === role) {
      allKnownUsers.set(user.id, JSON.parse(JSON.stringify(user)));
    }
  });
  
  // 2. Overlay/add users from localStorage for this role
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.role === role) {
              // If an initial mock user was signed up, their ID in localStorage is the Firebase UID.
              // We need to ensure this localStorage version (with potentially updated fields)
              // correctly represents the original user's data if the email matches.
              const originalUserWithSameEmail = global._initialMockUsers?.find(
                u => u.email.toLowerCase() === parsedProfile.email.toLowerCase() && u.role === role
              );

              if (originalUserWithSameEmail && originalUserWithSameEmail.id !== parsedProfile.id) {
                // This is a Firebase version of an original mock user.
                // We use the Firebase ID (parsedProfile.id) for auth consistency,
                // but ensure role and other critical mock associations from originalUserWithSameEmail are preserved if not in parsedProfile.
                // The parsedProfile itself should already have updated fields if settings were saved.
                // We effectively want the localStorage version but ensure it's linked to the 'concept' of the original.
                // The `allKnownUsers.set` will use parsedProfile.id as key.
                 allKnownUsers.set(parsedProfile.id, {
                    ...originalUserWithSameEmail, // Base default from original
                    ...parsedProfile, // Overlay with localStorage data (which has FB UID and potentially updated fields)
                    role: originalUserWithSameEmail.role, // Ensure original role is kept
                 });

              } else {
                 allKnownUsers.set(parsedProfile.id, parsedProfile); // Standard update or new user
              }
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  
  // 3. Ensure working array also reflects this consolidated view.
  // The `getMockUserByEmail` function is primarily responsible for syncing `global._mockUsers` on login/access.
  // This function (`getMockUsersByRole`) should reflect the current state of `global._mockUsers` for that role.
  // So, filter `global._mockUsers` directly.
   const usersFromWorkingArray = global._mockUsers?.filter(u => u.role === role).map(u => JSON.parse(JSON.stringify(u))) || [];
   usersFromWorkingArray.forEach(u => allKnownUsers.set(u.id, u));


  return Array.from(allKnownUsers.values());
};


    