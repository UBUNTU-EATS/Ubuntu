import "./IssuesPage.css";
import * as React from "react";
import { DataGrid } from '@mui/x-data-grid';

const columns = [
  { field: "issueTitle", headerName: 'Title', width: 200 },
  { field: "issueStatus", headerName: 'Status', width: 150 },
];


const IssuesPageList = ({issues}) => (
    <DataGrid rows={issues} columns={columns} pageSize={5} getRowId={(row) => row.issueID} />
);

export default IssuesPageList;