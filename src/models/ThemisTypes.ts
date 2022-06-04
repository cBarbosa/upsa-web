import { Timestamp } from "firebase/firestore";

export type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    instance?: string;
    themis_id?: number;
    deadline: DeadLineProcessType[];
    description_forward?:string;
    date_final?: string;
    active: boolean;
    created_at: Timestamp;
    updated_at: Timestamp;
};

export type DeadLineProcessType = {
    deadline_internal_date: string;
    deadline_court_date: string;
    deadline_interpreter: string;
    checked: boolean;
    created_at: Timestamp;
    checked_at: Timestamp;
};
