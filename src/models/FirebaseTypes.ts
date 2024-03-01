
export type UserType = {
    uid: string;
    displayName: string;
    email: string;
    role: string;
    photoURL?: string; // deprecar
    photoUrl?: string;
    phoneNumber?: string;
    themis_Id?: number;
    createdAt: string;
};
