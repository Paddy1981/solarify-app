
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

const specificTestUser: MockUser = {
  id: "homeowner-test-specific", // Unique mock ID for this test user
  fullName: "Aarav Menon Test User", // Distinguishable name
  email: "aarav.menon1@home.example.com", // The specific email from the test case
  password: "Solarify!123", // The specified password
  role: "homeowner", // Expected role
  avatarUrl: "https://placehold.co/100x100.png?text=AM",
  address: "123 Test Address, Testville, USA",
  phone: "555-010-0101",
  memberSince: new Date().toISOString().split("T")[0],
  location: "Testville, USA",
  currency: "USD",
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
  // Add the specific test user to the pristine list if not already present by email
  if (!pristineUsers.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase())) {
    pristineUsers.push(specificTestUser);
  }
  global._initialMockUsers = Object.freeze(JSON.parse(JSON.stringify(pristineUsers)));
}


if (!global._mockUsers) {
  global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
}
// Ensure the specific test user is also in the working _mockUsers array if it somehow got missed
if (global._mockUsers && !global._mockUsers.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase())) {
    const userFromInitial = global._initialMockUsers?.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase());
    if (userFromInitial) {
        global._mockUsers.push(JSON.parse(JSON.stringify(userFromInitial)));
    }
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
    effectiveUser = { ...userFromInitialSet }; 
    if (userFromStorage && userFromStorage.email.toLowerCase() === lowerEmail) {
      effectiveUser.fullName = userFromStorage.fullName || effectiveUser.fullName;
      effectiveUser.location = userFromStorage.location || effectiveUser.location;
      effectiveUser.currency = userFromStorage.currency || effectiveUser.currency;
      effectiveUser.phone = userFromStorage.phone || effectiveUser.phone;
      effectiveUser.avatarUrl = userFromStorage.avatarUrl || effectiveUser.avatarUrl;
      effectiveUser.companyName = userFromStorage.companyName || effectiveUser.companyName;
      effectiveUser.specialties = userFromStorage.specialties || effectiveUser.specialties;
      effectiveUser.productsOffered = userFromStorage.productsOffered || effectiveUser.productsOffered;
      // NOTE: effectiveUser.id remains from userFromInitialSet.
      // If userFromStorage.id (Firebase UID) is different, it means the initial mock user was "signed up".
      // We prioritize userFromInitialSet.id for consistency with mock data relations.
    }
  } else if (userFromStorage) {
    effectiveUser = userFromStorage;
  }


  if (global._mockUsers && effectiveUser) {
    const effectiveUserId = effectiveUser.id; 
    const effectiveUserEmailLower = effectiveUser.email.toLowerCase();

    if (userFromStorage && userFromStorage.id !== effectiveUserId && userFromStorage.email.toLowerCase() === effectiveUserEmailLower) {
        const conflictingStorageUserIndex = global._mockUsers.findIndex(u => u.id === userFromStorage!.id);
        if (conflictingStorageUserIndex !== -1) {
          global._mockUsers.splice(conflictingStorageUserIndex, 1);
        }
    }
    
    const existingUserIndexInWorkingArray = global._mockUsers.findIndex(u => u.id === effectiveUserId);
    if (existingUserIndexInWorkingArray === -1) {
      global._mockUsers.push(JSON.parse(JSON.stringify(effectiveUser)));
    } else {
      global._mockUsers[existingUserIndexInWorkingArray] = JSON.parse(JSON.stringify(effectiveUser));
    }
  }
  return effectiveUser ? JSON.parse(JSON.stringify(effectiveUser)) : undefined;
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
              const originalUserWithSameEmail = global._initialMockUsers?.find(
                u => u.email.toLowerCase() === parsedProfile.email.toLowerCase() && u.role === role
              );

              if (originalUserWithSameEmail && originalUserWithSameEmail.id !== parsedProfile.id) {
                 allKnownUsers.set(originalUserWithSameEmail.id, { // Use original ID as key
                    ...originalUserWithSameEmail, 
                    ...parsedProfile, 
                    id: originalUserWithSameEmail.id, // Ensure original ID is kept
                    role: originalUserWithSameEmail.role, 
                 });
                 // Remove the firebase ID one if it was accidentally added
                 if (allKnownUsers.has(parsedProfile.id) && parsedProfile.id !== originalUserWithSameEmail.id) {
                    allKnownUsers.delete(parsedProfile.id);
                 }
              } else {
                 allKnownUsers.set(parsedProfile.id, parsedProfile); 
              }
            }
          }
        } catch(e) { /* ignore */ }
      }
    }
  }
  
   const usersFromWorkingArray = global._mockUsers?.filter(u => u.role === role).map(u => JSON.parse(JSON.stringify(u))) || [];
   usersFromWorkingArray.forEach(u => {
     const originalUserWithSameEmail = global._initialMockUsers?.find(
       initUser => initUser.email.toLowerCase() === u.email.toLowerCase() && initUser.role === role
     );
     if (originalUserWithSameEmail && originalUserWithSameEmail.id !== u.id) {
       allKnownUsers.set(originalUserWithSameEmail.id, {
         ...originalUserWithSameEmail,
         ...u,
         id: originalUserWithSameEmail.id,
         role: originalUserWithSameEmail.role,
       });
       if (allKnownUsers.has(u.id) && u.id !== originalUserWithSameEmail.id) {
         allKnownUsers.delete(u.id);
       }
     } else {
       allKnownUsers.set(u.id, u);
     }
   });


  return Array.from(allKnownUsers.values());
};
