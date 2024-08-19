import { Timestamp } from "firebase/firestore";

export type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    instance?: string;
    themis_Id?: number;
    deadline: DeadLineProcessType[];
    description_Forward?:string;
    date_Final?: string;
    active: boolean;
    created_At: Date;
    updated_At: Date;
};

export type DeadLineProcessType = {
    deadline_Internal_Date: string;
    deadline_Court_Date: string;
    deadline_Interpreter: string;
    deadline_Internal_Date_Add?: string,
    deadline_Court_Date_Add?: string,
    checked: boolean;
    created_At: Date;
    // checked_At: Date;
};
