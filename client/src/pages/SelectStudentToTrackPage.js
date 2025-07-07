import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import AddStudent from "../components/AddStudent";
import DeleteStudent from "../components/deleteStudent";

export default function SelectStudentToTrackPage() {
  const navigate = useNavigate();
  const { loading, data } = useQuery(QUERY_ME);
  const students = data?.me?.students || [];

  // Handle student selection - navigate to tracking view
  const handleSelectStudent = (student) => {
    navigate('/mainTrackingView', { 
      state: { selectedStudent: student } 
    });
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 className="md-headline-large" style={{ marginBottom: 32 }}>
        <AddStudent />
        Select Student To Track
      </h1>
      <DeleteStudent students={students} onSelectStudent={handleSelectStudent} />
    </div>
  );
}