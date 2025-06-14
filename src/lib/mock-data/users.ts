
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
  id: "homeowner-test-specific", 
  fullName: "Aarav Menon Test User", 
  email: "aarav.menon1@home.example.com", 
  password: "Solarify!123", 
  role: "homeowner", 
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
  if (!pristineUsers.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase())) {
    pristineUsers.push(specificTestUser);
  }
  global._initialMockUsers = Object.freeze(JSON.parse(JSON.stringify(pristineUsers)));
}


if (!global._mockUsers) {
  global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
}

if (global._mockUsers && !global._mockUsers.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase())) {
    const userFromInitial = global._initialMockUsers?.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase());
    if (userFromInitial) {
        global._mockUsers.push(JSON.parse(JSON.stringify(userFromInitial)));
    }
}

export const mockUsers: MockUser[] = global._mockUsers!; 

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  const lowerEmail = email.toLowerCase();

  const initialProfile = global._initialMockUsers?.find(u => u.email.toLowerCase() === lowerEmail);
  let storageProfile: MockUser | null = null;

  if (typeof window !== 'undefined') {
    const storedProfileString = localStorage.getItem(`userProfile_${lowerEmail}`);
    if (storedProfileString) {
      try {
        storageProfile = JSON.parse(storedProfileString) as MockUser;
        if (storageProfile && storageProfile.email.toLowerCase() !== lowerEmail) {
            storageProfile = null; // Invalid storage entry
        }
      } catch (e) {
        console.error(`Failed to parse localStorage profile for ${lowerEmail}:`, e);
        localStorage.removeItem(`userProfile_${lowerEmail}`); 
        storageProfile = null;
      }
    }
  }

  let effectiveUser: MockUser | undefined = undefined;

  if (initialProfile) {
    effectiveUser = { ...initialProfile }; // Start with the pristine mock data (correct ID, role)
    if (storageProfile) {
      // Merge modifiable fields from localStorage, but keep initialProfile's id and role
      effectiveUser.fullName = storageProfile.fullName || effectiveUser.fullName;
      effectiveUser.location = storageProfile.location || effectiveUser.location;
      effectiveUser.currency = storageProfile.currency || effectiveUser.currency;
      effectiveUser.phone = storageProfile.phone || effectiveUser.phone;
      effectiveUser.avatarUrl = storageProfile.avatarUrl || effectiveUser.avatarUrl;
      effectiveUser.address = storageProfile.address || effectiveUser.address;
      // Role-specific updatable fields
      if (effectiveUser.role === 'installer') {
        effectiveUser.companyName = storageProfile.companyName || effectiveUser.companyName;
        effectiveUser.specialties = storageProfile.specialties || effectiveUser.specialties;
      } else if (effectiveUser.role === 'supplier') {
        effectiveUser.companyName = storageProfile.companyName || effectiveUser.companyName;
        effectiveUser.productsOffered = storageProfile.productsOffered || effectiveUser.productsOffered;
      }
    }
  } else if (storageProfile) {
    effectiveUser = storageProfile; // This is a user created purely through signup
  }

  // Synchronize global._mockUsers with the definitive effectiveUser
  if (global._mockUsers && effectiveUser) {
    const finalEffectiveUser = JSON.parse(JSON.stringify(effectiveUser));
    
    // Remove any existing entries for this user by effective ID or by a different storage ID (Firebase UID) if prioritizing mock ID
    const indicesToRemove: number[] = [];
    global._mockUsers.forEach((user, index) => {
      if (user.id === finalEffectiveUser.id) {
        indicesToRemove.push(index);
      } else if (storageProfile && storageProfile.id !== finalEffectiveUser.id && 
                 user.id === storageProfile.id && 
                 user.email.toLowerCase() === finalEffectiveUser.email.toLowerCase()) {
        // This covers the case where initialProfile was prioritized, and we need to remove the storageProfile's Firebase UID entry
        indicesToRemove.push(index);
      }
    });

    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      global._mockUsers.splice(indicesToRemove[i], 1);
    }
    
    global._mockUsers.push(finalEffectiveUser);
  }
  
  return effectiveUser ? JSON.parse(JSON.stringify(effectiveUser)) : undefined;
};


export const getMockUserById = (id: string): MockUser | undefined => {
  // Prioritize the actively maintained global._mockUsers list
  const userFromGlobal = global._mockUsers?.find(u => u.id === id);
  if (userFromGlobal) {
    return JSON.parse(JSON.stringify(userFromGlobal));
  }
  // Fallback for safety, though ideally global._mockUsers should be comprehensive
  const userFromInitial = global._initialMockUsers?.find(u => u.id === id);
  if (userFromInitial) {
    return JSON.parse(JSON.stringify(userFromInitial));
  }
  return undefined;
};


export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  // Primarily use global._mockUsers as it's intended to be the live, reconciled list
  if (!global._mockUsers) return [];

  const users = global._mockUsers.filter(u => u.role === role);
  
  // Deduplicate based on ID to be safe, preferring the ones already in global._mockUsers
  const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());
  return JSON.parse(JSON.stringify(uniqueUsers));
};
