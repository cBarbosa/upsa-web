import { Box, Button, Heading } from '@chakra-ui/react';
import type { NextPage } from 'next';
import Head from 'next/head'
import { useEffect, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext'

const Home: NextPage = () => {

  const { user, login, logout, role } = useAuth();
  const [profile, setProfile] = useState('');

  useEffect(()=>{

    setTimeout(() => {
      console.log('passo 5');
          role().then((res) =>{
      console.log('passo 6');
            setProfile(res);
          });
    }, 3000);
  }, []);

  return (
      <>
        <Head>
          <title>UPSA</title>
        </Head>

        <main>
          <Heading as={'h4'}>
            Welcome to <strong>Next.js</strong>!
          </Heading>

          <aside>
            <section>
              <Box>
                role = {profile}
                <pre>{JSON.stringify(user, null, 2)}</pre>
              </Box>
            </section>
            <section>
              <Box>
                <Button onClick={login}>Login Google</Button>
                <Button onClick={logout}>Logout</Button>
              </Box>
            </section>
          </aside>
        </main>

        <footer>
            Powered by CB
        </footer>
      </>
  )
}

export default Home;
