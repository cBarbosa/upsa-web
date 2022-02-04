import { Box, Container, Stack, Text } from "@chakra-ui/react";
import { Fragment } from "react";

export default function BottomNav() {

    return(
        <Fragment>
        <hr/>
        <Box
            pb={3}
            pt={3}
            bg={'gray.50'}
        >
            <Container
                as={Stack}
                maxW={'6xl'}
                py={4}
                direction={{base: 'column', md: 'row'}}
                spacing={4}
                justify={'center'}
                align={'center'}>
                <Text fontSize={'14px'} textAlign={'center'}>© 2022 UPSA - Todos os Direitos Reservados</Text>
            </Container>
        </Box>
        </Fragment>
    );

}
