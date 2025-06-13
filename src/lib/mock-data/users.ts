
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

const generateRandomUser = (role: UserRole, index: number): MockUser => {
  const firstName = southIndianFirstNames[Math.floor(Math.random() * southIndianFirstNames.length)];
  const lastName = southIndianLastNames[Math.floor(Math.random() * southIndianLastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const emailDomain = role === "homeowner" ? "home.example.com" : (role === "installer" ? "install.example.com" : "supply.example.com");
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${String(index).padStart(3, '0')}@${emailDomain}`;
  const id = `${role}-user-${String(index).padStart(3, '0')}`;
  const memberSinceDate = new Date(2020 + Math.floor(Math.random()*4), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
  const mockPassword = "Solarify!123"; // Default password for all mock users

  const commonProfile: MockUser = {
    id,
    fullName,
    email,
    password: mockPassword,
    role,
    avatarUrl: `https://placehold.co/100x100.png?text=${firstName[0]}${lastName[0]}`,
    address: `${100 + index} Main St, ${sampleLocations[index % sampleLocations.length].split(',')[0]}, India`, // More specific address
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

export const mockUsers: MockUser[] = [];

// Generate 10 homeowners
for (let i = 1; i <= 10; i++) {
  mockUsers.push(generateRandomUser("homeowner", i));
}

// Generate 10 installers
for (let i = 1; i <= 10; i++) {
  mockUsers.push(generateRandomUser("installer", i));
}

// Generate 10 suppliers
for (let i = 1; i <= 10; i++) {
  mockUsers.push(generateRandomUser("supplier", i));
}


// Existing helper functions
export const getMockUserById = (id: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  return mockUsers.filter(user => user.role === role);
};
