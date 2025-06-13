
export type UserRole = "homeowner" | "installer" | "supplier";

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string; // Optional: if you plan to use avatars
}

export const mockUsers: MockUser[] = [
  {
    id: "user-001",
    fullName: "Alice Wonderland",
    email: "alice.wonderland@example.com",
    role: "homeowner",
    avatarUrl: "https://placehold.co/100x100.png?text=AW",
  },
  {
    id: "user-002",
    fullName: "Bob The Builder",
    email: "bob.builder@example.com",
    role: "installer",
    avatarUrl: "https://placehold.co/100x100.png?text=BB",
  },
  {
    id: "user-003",
    fullName: "Charlie Supply",
    email: "charlie.supply@example.com",
    role: "supplier",
    avatarUrl: "https://placehold.co/100x100.png?text=CS",
  },
  {
    id: "user-004",
    fullName: "Diana Prince",
    email: "diana.prince@example.com",
    role: "homeowner",
  },
  {
    id: "user-005",
    fullName: "Edward Install",
    email: "ed.install@example.com",
    role: "installer",
    avatarUrl: "https://placehold.co/100x100.png?text=EI",
  },
];

export const getMockUserById = (id: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getMockUsersByRole = (role: UserRole): MockUser[] => {
  return mockUsers.filter(user => user.role === role);
};
