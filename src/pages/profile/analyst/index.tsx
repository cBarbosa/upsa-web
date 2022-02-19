import Head from "next/head";
import { GetServerSideProps, NextPage } from "next/types";
import BottomNav from "../../../Components/BottomNav";
import NavBar from "../../../Components/NavBar";
import { useAuth } from "../../../Contexts/AuthContext";
import {parseCookies} from "nookies";
import {Box, Container, Heading, Text} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../../../services/firebase";
import DataTableRCkakra from "../../../Components/Table";

type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    deadline: DeadLineProcessType[];
    active: boolean;
    created_at: Timestamp;
    updated_at: Timestamp;
};

type DeadLineProcessType = {
    deadline_days: number;
    deadline_date: Timestamp;
    deadline_interpreter: string;
    checked: boolean;
    created_at: Timestamp;
};

const AnalystHome: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const { isAuthenticated, role, user } = useAuth();
    const [processList, setProcessList] = useState<ProcessType[]>([]);

    useEffect(() => {
        getProcessList();
    }, []);

    const getProcessList = async () => {
        const processQuery = query(proccessCollection, where('active', '==', true));
        const querySnapshot = await getDocs(processQuery);

        let result:ProcessType[] = [];
        querySnapshot.forEach((snapshot) => {
            result.push({
                uid: snapshot.id,
                number: snapshot.data().number,
                author: snapshot.data().author,
                defendant: snapshot.data().defendant,
                decision: snapshot.data().decision,
                accountable: snapshot.data().accountable,
                deadline: snapshot.data().deadline,
                created_at: snapshot.data().created_at,
                updated_at: snapshot.data().updated_at,
                active: snapshot.data().active
            });
        });
        setProcessList(result);
    };

    function getProcessFromData() {
        const arrData: {
            number: string;
            author: string;
            defendant: string;
            created_at: string;
            edit: object;
        }[] = [];

        processList.map(proc => {
            arrData.push({
                number: proc.number,
                author: proc.author,
                defendant: proc.defendant,
                created_at: proc.created_at.toDate().toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                edit: (proc)
            });
        });
        return arrData;
    }

    const columns = useMemo(
        () => [
            {
                Header: 'Processo',
                accessor: 'number',
            },
            {
                Header: 'Autor',
                accessor: 'author',
            },
            {
                Header: 'Réu',
                accessor: 'defendant',
            },
            {
                Header: 'Dt. Criação',
                accessor: 'created_at',
            },
            {
                Header: 'Editar',
                accessor: 'edit',
            }
        ],
        [],
    );

    const dataTable = useMemo(
        () => getProcessFromData(), [process],
    );

    return (
        <>
          <Head>
            <title>UPSA - Analista</title>
          </Head>
  
          <NavBar/>

            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Heading color={'gray.600'}>
                    Análises
                </Heading>
                
                {processList.length > 0 ? (
                        <Box
                            py={30}
                        >
                            <DataTableRCkakra columns={columns} data={getProcessFromData()}/>
                        </Box>
                    ) : (
                    <Text
                        py={10}
                    >
                        Nenhum processo cadastrado
                    </Text>
                )}
            </Container>

          <BottomNav />
        </>
    );
}
  
export default AnalystHome;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const {['upsa.role']: upsaRole} = parseCookies(ctx);
    const acceptedRules = ['admin', 'avocado', 'analyst']
    if (!acceptedRules.includes(upsaRole)) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }
    return {
        props: {}
    };
}
