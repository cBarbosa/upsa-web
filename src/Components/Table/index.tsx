import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    chakra,
    TableCaption,
    IconButton,
    Select,
    Box,
    GridItem,
    Grid
} from '@chakra-ui/react'
import {
    ArrowBackIcon,
    ArrowForwardIcon,
    ArrowLeftIcon, ArrowRightIcon,
    TriangleDownIcon,
    TriangleUpIcon
} from '@chakra-ui/icons'
// @ts-ignore
import {useTable, usePagination} from 'react-table'
import {Fragment} from "preact";
import React from "react";

function DataTable({columns, data}: any) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page, prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: {pageIndex, pageSize},
    } = useTable({columns, data, initialState: {pageIndex: 0},}, usePagination)

    return (
        <>
            <Table variant={'striped'} colorScheme={'blue'} {...getTableProps()}>
                <Thead>
                    {headerGroups.map((headerGroup: any) => (
                        <Tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column: any) => (
                                <Th
                                    {...column.getHeaderProps(column.getHeaderProps())}
                                    isNumeric={column.isNumeric}
                                >
                                    {column.render('Header')}
                                    <chakra.span pl='4'>
                                        {column.isSorted ? (
                                            column.isSortedDesc ? (
                                                <TriangleDownIcon aria-label='sorted descending'/>
                                            ) : (
                                                <TriangleUpIcon aria-label='sorted ascending'/>
                                            )
                                        ) : null}
                                    </chakra.span>
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>
                <Tbody {...getTableBodyProps()}>
                    {page.map((row: any) => {
                        prepareRow(row)
                        return (
                            <Tr {...row.getRowProps()}>
                                {row.cells.map((cell: any) => (
                                    <Td {...cell.getCellProps()} isNumeric={cell.column.isNumeric}>
                                        {cell.render('Cell')}
                                    </Td>
                                ))}
                            </Tr>
                        )
                    })}
                </Tbody>
            </Table>
            <Box py={3}>
                <Grid className="pagination" templateColumns='repeat(3, 1fr)' gap={2} alignItems={'center'}>
                    <GridItem>
                        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                            {<IconButton aria-label='Search database' icon={<ArrowLeftIcon/>}/>}
                        </button>
                        {' '}
                        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                            {<IconButton aria-label='Search database' icon={<ArrowBackIcon/>}/>}
                        </button>
                        {' '}
                        <button onClick={() => nextPage()} disabled={!canNextPage}>
                            {<IconButton aria-label='Search database' icon={<ArrowForwardIcon/>}/>}
                        </button>
                        {' '}
                        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                            {<IconButton aria-label='Search database' icon={<ArrowRightIcon/>}/>}
                        </button>
                        {' '}
                    </GridItem>
                    <GridItem>
                        <span>Página{' '} <strong> {pageIndex + 1} de {pageOptions.length} </strong>{' '}</span>
                        {/*        <span>*/}
                        {/*  | Ir para a página:{' '}*/}
                        {/*            <input*/}
                        {/*                type="number"*/}
                        {/*                defaultValue={pageIndex + 1}*/}
                        {/*                onChange={e => {*/}
                        {/*                    const page = e.target.value ? Number(e.target.value) - 1 : 0*/}
                        {/*                    gotoPage(page)*/}
                        {/*                }}*/}
                        {/*                style={{ width: '100px' }}*/}
                        {/*            />*/}
                        {/*</span>{' '}*/}
                    </GridItem>
                    <GridItem>
                        <Select
                            maxW={'180px'}
                            float={'right'}
                            placeholder='Select option'
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value))
                            }}>
                            {[10, 20, 30, 40, 50].map(pageSize => (
                                <option key={pageSize} value={pageSize}>
                                    Mostrar {pageSize}
                                </option>
                            ))}
                        </Select>
                    </GridItem>
                </Grid>
            </Box>
        </>
    )
}

export default DataTable;