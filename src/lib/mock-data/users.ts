
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
  var _initialMockUsers: MockUser[] | undefined;
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

if (!global._mockUsers) {
  console.log("Initializing global._mockUsers and global._initialMockUsers for the first time.");
  global._mockUsers = [];
  for (let i = 1; i <= 10; i++) {
    global._mockUsers.push(generateRandomUser("homeowner", i));
  }
  for (let i = 1; i <= 10; i++) {
    global._mockUsers.push(generateRandomUser("installer", i));
  }
  for (let i = 1; i <= 10; i++) {
    global._mockUsers.push(generateRandomUser("supplier", i));
  }
  global._initialMockUsers = JSON.parse(JSON.stringify(global._mockUsers)); // Deep clone for pristine initial set
  console.log(`Initial global._mockUsers count: ${global._mockUsers.length}`);
} else if (!global._initialMockUsers && global._mockUsers.length > 0) {
  // Handle cases where global._mockUsers might exist from a previous state (e.g. fast refresh)
  // but _initialMockUsers was not set.
  console.log("Re-initializing global._initialMockUsers from existing global._mockUsers.");
  global._initialMockUsers = JSON.parse(JSON.stringify(global._mockUsers));
}


export const mockUsers: MockUser[] = global._mockUsers || [];

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  const lowerEmail = email.toLowerCase();

  // Find if this email corresponds to an original, pre-defined mock user
  const userFromInitialSet = global._initialMockUsers?.find(u => u.email.toLowerCase() === lowerEmail);

  if (typeof window !== 'undefined') {
    const storedProfileString = localStorage.getItem(`userProfile_${lowerEmail}`);
    if (storedProfileString) {
      const userFromStorage = JSON.parse(storedProfileString) as MockUser;

      // If this email matches an original mock user, AND the stored ID is a Firebase UID (complex),
      // prefer returning the original mock user to maintain sample data integrity for that specific demo user.
      if (userFromInitialSet &&
          userFromInitialSet.id.includes("-user-") && // Original mock ID pattern
          !userFromStorage.id.includes("-user-") &&   // Stored ID is not mock pattern (likely FB UID)
          userFromStorage.id.length > 20             // Firebase UIDs are typically long
         ) {
        // Ensure this preferred original mock user is in the active global._mockUsers
        if (global._mockUsers) {
            const activeGlobalUserIndex = global._mockUsers.findIndex(u => u.id === userFromInitialSet.id);
            if (activeGlobalUserIndex === -1) {
                // If the Firebase UID version was there, remove it
                const fbUserIndex = global._mockUsers.findIndex(u => u.id === userFromStorage.id);
                if (fbUserIndex !== -1) global._mockUsers.splice(fbUserIndex, 1);
                global._mockUsers.push(userFromInitialSet); // Add the original one
            } else {
                // Original is already there and active, ensure it's the one from initial set
                global._mockUsers[activeGlobalUserIndex] = userFromInitialSet;
            }
        }
        return userFromInitialSet;
      }

      // Otherwise, localStorage user is the source of truth.
      // Ensure it's reflected in global._mockUsers for the current session.
      if (global._mockUsers) {
        const existingUserIndex = global._mockUsers.findIndex(u => u.id === userFromStorage.id);
        if (existingUserIndex === -1) {
          // Before adding, remove any other profile with the same email but different ID from global._mockUsers
          // to prevent duplicates if the initial set had this email.
          const conflictingUserIndex = global._mockUsers.findIndex(u => u.email.toLowerCase() === lowerEmail && u.id !== userFromStorage.id);
          if (conflictingUserIndex !== -1) {
            global._mockUsers.splice(conflictingUserIndex, 1);
          }
          global._mockUsers.push(userFromStorage);
        } else {
          global._mockUsers[existingUserIndex] = userFromStorage; // Update if exists
        }
      }
      return userFromStorage;
    }
  }

  // Fallback: If no localStorage, or if it's server-side, use the initial set if matched,
  // otherwise use the current (possibly mutated) global._mockUsers.
  if (userFromInitialSet) return userFromInitialSet;
  return global._mockUsers?.find(u => u.email.toLowerCase() === lowerEmail);
};


export const getMockUserById = (id: string): MockUser | undefined => {
  // Check active global list first (which might contain users from localStorage)
  let user = global._mockUsers?.find(u => u.id === id);
  if (user) return user;

  // Fallback to initial set if not found in active list (e.g. if global_mockUsers was cleared)
  user = global._initialMockUsers?.find(u => u.id === id);
  if (user && global._mockUsers && !global._mockUsers.find(u => u.id === id)) {
      // If found in initial but not active, add to active for consistency this session
      global._mockUsers.push(user);
  }
  
  if (!user && typeof window !== 'undefined') {
    // Secondary check: Iterate localStorage if ID not in memory (less efficient)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.id === id) {
               if (global._mockUsers && !global._mockUsers.some(u => u.id === parsedProfile.id)) {
                 global._mockUsers.push(parsedProfile);
               }
              return parsedProfile;
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  return user;
};


export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  const allKnownUsers = new Map<string, MockUser>();

  // Add initial mock users first
  global._initialMockUsers?.forEach(user => {
    if (user.role === role) {
      allKnownUsers.set(user.id, user);
    }
  });
  
  // Add/update with users from localStorage
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.role === role) {
              allKnownUsers.set(parsedProfile.id, parsedProfile); // Overwrites if ID exists, adds if new
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  
  // Also ensure current global._mockUsers are considered, as they might have been updated by recent logins
   global._mockUsers?.forEach(user => {
    if (user.role === role) {
      allKnownUsers.set(user.id, user); // Overwrites if ID exists, adds if new
    }
  });

  return Array.from(allKnownUsers.values());
};

