
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
  console.log("Initializing global._mockUsers for the first time.");
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
  console.log(`Initial global._mockUsers count: ${global._mockUsers.length}`);
}

export const mockUsers: MockUser[] = global._mockUsers;

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  const lowerEmail = email.toLowerCase();
  let userFromStorage: MockUser | undefined = undefined;

  if (typeof window !== 'undefined') {
    try {
      const storedProfile = localStorage.getItem(`userProfile_${lowerEmail}`);
      if (storedProfile) {
        userFromStorage = JSON.parse(storedProfile) as MockUser;
        // Ensure this user is also in the current global._mockUsers for consistency.
        // This helps getMockUserById if global_mockUsers was reset and this user logged in.
        if (global._mockUsers && userFromStorage) {
          const existsInGlobal = global._mockUsers.some(u => u.id === userFromStorage!.id);
          if (!existsInGlobal) {
            // Check if an object with the same email but different ID exists to avoid email collision with different UIDs
            const existingUserWithSameEmail = global._mockUsers.find(u => u.email.toLowerCase() === lowerEmail);
            if (!existingUserWithSameEmail) {
                 global._mockUsers.push(userFromStorage);
                 console.log("Added user from localStorage to global._mockUsers:", userFromStorage.email);
            } else if (existingUserWithSameEmail.id !== userFromStorage.id) {
                console.warn(`User with email ${lowerEmail} from localStorage has ID ${userFromStorage.id}, but global _mockUsers has ID ${existingUserWithSameEmail.id}. Not adding from localStorage to prevent ID conflict for the same email.`);
            }
          }
        }
        return userFromStorage;
      }
    } catch (e) {
      console.error("Error reading/parsing user profile from localStorage for email:", lowerEmail, e);
      // localStorage.removeItem(`userProfile_${lowerEmail}`); // Optional: remove corrupted data
    }
  }

  // Fallback to global._mockUsers if not found in localStorage or if server-side
  const userFromGlobal = global._mockUsers?.find(u => u.email.toLowerCase() === lowerEmail);
  return userFromGlobal;
};


export const getMockUserById = (id: string): MockUser | undefined => {
  // Primarily relies on global._mockUsers.
  // For users created via signup, their profile might be re-added to global._mockUsers
  // by getMockUserByEmail if they log in.
  let user = global._mockUsers?.find(u => u.id === id);

  // As an additional fallback, if not in global, try to find any user profile in localStorage
  // that has this ID. This is less direct than by email key but can help in some edge cases.
  // This part is more complex as it involves iterating localStorage keys or having a known set of user IDs.
  // For simplicity, we'll keep getMockUserById primarily focused on global._mockUsers.
  // The logic in getMockUserByEmail that re-adds to global._mockUsers is the main mechanism for consistency.
  if (!user && typeof window !== 'undefined') {
    // This is a secondary, less efficient check.
    // Only really useful if getMockUserByEmail hasn't been called for this user yet in the session.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.id === id) {
              // Found by ID. Ensure it's in global for next time.
               if (global._mockUsers && !global._mockUsers.some(u => u.id === parsedProfile.id)) {
                 global._mockUsers.push(parsedProfile);
                 console.log("Added user (found by ID in localStorage) to global._mockUsers:", parsedProfile.email);
               }
              return parsedProfile;
            }
          }
        } catch(e) {
          console.error("Error checking localStorage for user by ID:", id, e);
        }
      }
    }
  }
  return user;
};


export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  // Ensure localStorage users of this role are considered, especially if global_mockUsers was reset.
  // This is non-trivial to merge efficiently without duplicates if global_mockUsers still has some defaults.
  // For now, rely on getMockUserByEmail/ById having populated global._mockUsers from localStorage if relevant users logged in.
  let usersFromGlobal = global._mockUsers?.filter(user => user.role === role) || [];

  if (typeof window !== 'undefined') {
    const allLocalStorageUsers: MockUser[] = [];
     for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userProfile_')) {
        try {
          const storedProfile = localStorage.getItem(key);
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile) as MockUser;
            if (parsedProfile.role === role) {
              allLocalStorageUsers.push(parsedProfile);
            }
          }
        } catch(e) { /* ignore parse errors */ }
      }
    }
    // Merge, giving precedence to users from localStorage if IDs match or adding if new
    const combinedUsers = [...usersFromGlobal];
    allLocalStorageUsers.forEach(lsUser => {
      const indexInGlobal = combinedUsers.findIndex(gUser => gUser.id === lsUser.id);
      if (indexInGlobal !== -1) {
        combinedUsers[indexInGlobal] = lsUser; // Update with localStorage version
      } else {
        combinedUsers.push(lsUser); // Add new from localStorage
      }
    });
    return combinedUsers;
  }

  return usersFromGlobal;
};
