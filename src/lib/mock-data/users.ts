
export type UserRole = "homeowner" | "installer" | "supplier";

// Assuming SystemConfigData will be defined elsewhere, e.g., where SystemSetupForm is
// For now, we'll treat it as an implicit part of the user's Firestore document if role is homeowner
// and journey choice is 'existing_configured'.
interface SystemConfigData {
  systemSizeKW: number;
  installationDate: string;
  location: string;
}

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  password?: string; 
  role: UserRole;
  avatarUrl?: string;
  address?: string; 
  phone?: string;
  companyName?: string; 
  specialties?: string[]; 
  productsOffered?: string[]; 
  projectCount?: number; 
  storeRating?: number; 
  memberSince?: string; 
  location?: string; 
  preferredCurrency?: string; 
  lastLogin?: string | Date; // Allow Date for runtime, string for mock data
  isActive?: boolean;
  // Homeowner specific dashboard state
  dashboardJourneyChoice?: 'existing_configured' | 'new_to_solar' | 'needs_choice';
  systemConfiguration?: SystemConfigData;
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
  var _mockUsers: MockUser[] | undefined;
  var _initialMockUsers: ReadonlyArray<MockUser> | undefined; 
}

const specificTestUser: MockUser = {
  id: "homeowner-user-specific-aarav", 
  fullName: "Aarav Menon Test User", 
  email: "aarav.menon1@home.example.com", 
  password: "Solarify!123", 
  role: "homeowner", 
  avatarUrl: "https://placehold.co/100x100.png?text=AM",
  address: "123 Test Address, Testville, USA",
  phone: "555-010-0101",
  memberSince: "2024-01-01", 
  location: "Testville, USA",
  preferredCurrency: "USD",
  lastLogin: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(), 
  isActive: true,
  dashboardJourneyChoice: 'needs_choice', 
};


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
    preferredCurrency: sampleCurrencies[index % sampleCurrencies.length],
    lastLogin: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
    isActive: Math.random() > 0.1, 
    dashboardJourneyChoice: role === 'homeowner' ? 'needs_choice' : undefined,
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
  if (!pristineUsers.find(u => u.email.toLowerCase() === specificTestUser.email.toLowerCase())) {
    pristineUsers.push(specificTestUser);
  }
  global._initialMockUsers = Object.freeze(JSON.parse(JSON.stringify(pristineUsers)));
}


if (!global._mockUsers) {
  global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
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
        if (!storageProfile || typeof storageProfile.email !== 'string' || storageProfile.email.toLowerCase() !== lowerEmail) {
            console.warn(`Invalid or mismatched profile in localStorage for ${lowerEmail}. Discarding.`);
            localStorage.removeItem(`userProfile_${lowerEmail}`);
            storageProfile = null;
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
    effectiveUser = { ...initialProfile }; 
    
    if (storageProfile) {
      effectiveUser.fullName = storageProfile.fullName || effectiveUser.fullName;
      effectiveUser.location = storageProfile.location || effectiveUser.location;
      effectiveUser.preferredCurrency = storageProfile.preferredCurrency || effectiveUser.preferredCurrency;
      effectiveUser.phone = storageProfile.phone || effectiveUser.phone;
      effectiveUser.avatarUrl = storageProfile.avatarUrl || effectiveUser.avatarUrl;
      effectiveUser.address = storageProfile.address || effectiveUser.address;
      effectiveUser.memberSince = storageProfile.memberSince || effectiveUser.memberSince;
      effectiveUser.password = storageProfile.password || effectiveUser.password; 
      effectiveUser.lastLogin = storageProfile.lastLogin || effectiveUser.lastLogin;
      effectiveUser.isActive = storageProfile.isActive !== undefined ? storageProfile.isActive : effectiveUser.isActive;
      effectiveUser.dashboardJourneyChoice = storageProfile.dashboardJourneyChoice || effectiveUser.dashboardJourneyChoice;
      effectiveUser.systemConfiguration = storageProfile.systemConfiguration || effectiveUser.systemConfiguration;


      if (effectiveUser.role === 'installer') {
        effectiveUser.companyName = storageProfile.companyName || effectiveUser.companyName;
        effectiveUser.specialties = storageProfile.specialties || effectiveUser.specialties;
        effectiveUser.projectCount = storageProfile.projectCount ?? effectiveUser.projectCount;
      } else if (effectiveUser.role === 'supplier') {
        effectiveUser.companyName = storageProfile.companyName || effectiveUser.companyName;
        effectiveUser.productsOffered = storageProfile.productsOffered || effectiveUser.productsOffered;
        effectiveUser.storeRating = storageProfile.storeRating ?? effectiveUser.storeRating;
      }
      
      if (storageProfile.id !== effectiveUser.id) {
        effectiveUser.id = storageProfile.id;
      }
    }
  } else if (storageProfile) {
    effectiveUser = storageProfile; 
  }

  if (global._mockUsers && effectiveUser) {
    const finalEffectiveUser = JSON.parse(JSON.stringify(effectiveUser)); 
    const existingUserIndex = global._mockUsers.findIndex(u => u.id === finalEffectiveUser.id || u.email.toLowerCase() === finalEffectiveUser.email.toLowerCase());
    if (existingUserIndex !== -1) {
        global._mockUsers[existingUserIndex] = finalEffectiveUser;
    } else {
        global._mockUsers.push(finalEffectiveUser);
    }
  }
  
  return effectiveUser ? JSON.parse(JSON.stringify(effectiveUser)) : undefined;
};


export const getMockUserById = (id: string): MockUser | undefined => {
  if (!global._mockUsers) return undefined;
  const userFromGlobal = global._mockUsers.find(u => u.id === id);
  if (userFromGlobal) {
    return JSON.parse(JSON.stringify(userFromGlobal));
  }
  const userFromInitial = global._initialMockUsers?.find(u => u.id === id);
  if (userFromInitial) {
    return JSON.parse(JSON.stringify(userFromInitial));
  }
  return undefined;
};


export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  if (!global._mockUsers) return [];
  const users = global._mockUsers.filter(u => u.role === role);
  const uniqueUsersMap = new Map<string, MockUser>();
  users.forEach(user => {
    if (!uniqueUsersMap.has(user.id)) {
      uniqueUsersMap.set(user.id, user);
    }
  });
  return JSON.parse(JSON.stringify(Array.from(uniqueUsersMap.values())));
};

export function resetGlobalMockUsers() {
  if (global._initialMockUsers) {
    global._mockUsers = JSON.parse(JSON.stringify(global._initialMockUsers));
    console.log("_mockUsers has been reset to initial state.");
  } else {
    console.warn("_initialMockUsers not found, cannot reset _mockUsers.");
  }
}

// It's good practice to also export SystemConfigData if it's defined here,
// or ensure it's consistently defined/imported where needed.
// For now, assuming it's implicitly handled or defined in the form component.
export type { SystemConfigData };

