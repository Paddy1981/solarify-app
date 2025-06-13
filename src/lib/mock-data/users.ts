
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
  var _initialMockUsers: ReadonlyArray<MockUser> | undefined; // Holds the pristine generated set
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

// Initialize _initialMockUsers only if it truly hasn't been set.
// This ensures it always holds the pristine set from generation.
if (!global._initialMockUsers) {
  // console.log("Generating global._initialMockUsers for the very first time or after full reset.");
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
  // Deep clone and freeze to make it truly read-only and prevent accidental modification.
  global._initialMockUsers = Object.freeze(JSON.parse(JSON.stringify(pristineUsers)));
  // console.log(`Initial global._initialMockUsers count: ${global._initialMockUsers.length}`);
}

// Initialize _mockUsers (the working array) if it doesn't exist.
// It starts as a mutable copy of the pristine _initialMockUsers.
if (!global._mockUsers) {
  // console.log("Initializing global._mockUsers as a copy of global._initialMockUsers.");
  global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
}


export const mockUsers: MockUser[] = global._mockUsers!; // Assert non-null as it's initialized above

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  const lowerEmail = email.toLowerCase();

  const userFromInitialSet = global._initialMockUsers?.find(u => u.email.toLowerCase() === lowerEmail);
  let userFromStorage: MockUser | null = null;

  if (typeof window !== 'undefined') {
    const storedProfileString = localStorage.getItem(`userProfile_${lowerEmail}`);
    if (storedProfileString) {
      try {
        userFromStorage = JSON.parse(storedProfileString) as MockUser;
      } catch (e) {
        console.error(`Failed to parse localStorage profile for ${lowerEmail}:`, e);
        localStorage.removeItem(`userProfile_${lowerEmail}`); // Clear corrupted entry
        userFromStorage = null;
      }
    }
  }

  let effectiveUser: MockUser | undefined = undefined;

  if (userFromInitialSet) {
    if (userFromStorage &&
        userFromStorage.email.toLowerCase() === lowerEmail && // Ensure email actually matches
        userFromInitialSet.id.includes("-user-") &&      // Original mock ID pattern
        !userFromStorage.id.includes("-user-") &&       // Stored ID is not mock pattern (likely FB UID)
        userFromStorage.id.length > 20                  // Firebase UIDs are typically long
    ) {
      effectiveUser = userFromInitialSet;
    } else if (userFromStorage && userFromStorage.email.toLowerCase() === lowerEmail) {
      effectiveUser = userFromStorage;
    } else {
      effectiveUser = userFromInitialSet;
    }
  } else if (userFromStorage) {
    effectiveUser = userFromStorage;
  }

  // Synchronize global._mockUsers (the working array)
  if (global._mockUsers && effectiveUser) {
    const effectiveUserId = effectiveUser.id;
    const effectiveUserEmail = effectiveUser.email.toLowerCase();

    // Remove any user from working array that has the same email but a *different* ID than effectiveUser
    const conflictingEmailIndex = global._mockUsers.findIndex(u => u.email.toLowerCase() === effectiveUserEmail && u.id !== effectiveUserId);
    if (conflictingEmailIndex !== -1) {
      global._mockUsers.splice(conflictingEmailIndex, 1);
    }

    const existingUserIndexInWorkingArray = global._mockUsers.findIndex(u => u.id === effectiveUserId);
    if (existingUserIndexInWorkingArray === -1) {
      global._mockUsers.push(JSON.parse(JSON.stringify(effectiveUser))); // Add a copy
    } else {
      global._mockUsers[existingUserIndexInWorkingArray] = JSON.parse(JSON.stringify(effectiveUser)); // Update with a copy
    }
  }
  return effectiveUser ? JSON.parse(JSON.stringify(effectiveUser)) : undefined; // Return a copy
};


export const getMockUserById = (id: string): MockUser | undefined => {
  const userFromWorkingArray = global._mockUsers?.find(u => u.id === id);
  if (userFromWorkingArray) return JSON.parse(JSON.stringify(userFromWorkingArray));

  const userFromInitialSet = global._initialMockUsers?.find(u => u.id === id);
  if (userFromInitialSet) {
    if (global._mockUsers && !global._mockUsers.find(u => u.id === id)) {
      global._mockUsers.push(JSON.parse(JSON.stringify(userFromInitialSet)));
    }
    return JSON.parse(JSON.stringify(userFromInitialSet));
  }
  
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
                 global._mockUsers.push(parsedProfile); 
               }
              return parsedProfile;
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

  global._initialMockUsers?.forEach(user => {
    if (user.role === role) {
      allKnownUsers.set(user.id, JSON.parse(JSON.stringify(user)));
    }
  });
  
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.role === role) {
              allKnownUsers.set(parsedProfile.id, parsedProfile);
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  
   global._mockUsers?.forEach(user => {
    if (user.role === role) {
      allKnownUsers.set(user.id, JSON.parse(JSON.stringify(user)));
    }
  });

  const finalUsers = Array.from(allKnownUsers.values());
  // Sync global._mockUsers with this consolidated list for the given role
  if (global._mockUsers) {
    const otherRoleUsers = global._mockUsers.filter(u => u.role !== role);
    const updatedRoleUsers = finalUsers.map(fu => {
      const existing = global._mockUsers!.find(mu => mu.id === fu.id);
      return existing ? { ...existing, ...fu } : fu;
    });
    // global._mockUsers = [...otherRoleUsers, ...updatedRoleUsers]; // This line can cause issues if not careful with duplicates by ID
    // A safer sync: ensure all `finalUsers` are in `global._mockUsers` correctly.
     finalUsers.forEach(fu => {
        const idx = global._mockUsers!.findIndex(mu => mu.id === fu.id);
        if (idx === -1) {
             const emailConflictIdx = global._mockUsers!.findIndex(mu => mu.email.toLowerCase() === fu.email.toLowerCase() && mu.id !== fu.id);
            if (emailConflictIdx !== -1) {
                global._mockUsers!.splice(emailConflictIdx, 1);
            }
            global._mockUsers!.push(JSON.parse(JSON.stringify(fu)));
        } else {
            global._mockUsers![idx] = JSON.parse(JSON.stringify(fu));
        }
    });
  }

  return finalUsers;
};
